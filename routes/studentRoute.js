const express = require("express");
const mongoose = require("mongoose");
const router = express.Router({ mergeParams: true }); //help to join the the partent and child routes
const ExpressError = require("../ExpressError");
const { loginSchema } = require("../schema");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("../models/users.js");
passport.use(User.createStrategy());
const path = require("path");
const Batch = require("../models/batch");
const Assignment = require("../models/assignment");
const multer = require("multer");
const axios = require("axios");
const { storage } = require("../config/cloudConfig.js");
const upload = multer({ storage });
const { cloudinary } = require("../config/cloudConfig.js");
const Submission = require("../models/submissionSchema.js");
const methodOverride = require("method-override");

router.use(methodOverride("_method"));

router.use(express.static(path.join(__dirname, "views")));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function asyncWrap(func) {
  return (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
}

router.get(
  "/student",
  isLoggedIn,
  asyncWrap(async (req, res) => {
    const stud_id = req.user._id;

    const batches = await Batch.find({
      students: stud_id,
    });

    const info = {
      name: req.user.name,
      batches: batches,
    };

    res.render("./student/dashboard", { info });
  }),
);

router.get(
  "/student/:batchId/task",
  isLoggedIn,
  asyncWrap(async (req, res) => {
    const { batchId } = req.params;

    const assignments = await Assignment.find({ batch: batchId })
      .sort({ createdAt: -1 })
      .populate("batch")
      .populate("teacher");

    const batch = await Batch.findById(batchId);

    console.log(assignments);

    res.render("./student/dailyTask", { assignments, batch });
  }),
);

router.post(
  "/assignments/:assignmentId/submit",
  upload.single("zip_file"),
  asyncWrap(async (req, res) => {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    if (!req.file) {
      return res.status(400).send("Please upload a file");
    }

    const submission = await Submission.create({
      assignment: assignmentId,
      student: studentId,
      fileUrl: req.file.path,
      publicId: req.file.filename,
      fileName: req.file.originalname,
    });

    console.log("Submission created:", submission);

    res.redirect("/student");
  }),
);

router.delete(
  "/assignments/:assignmentId/delete",
  isLoggedIn,
  asyncWrap(async (req, res) => {
    console.log(
      "Delete request received for assignment:",
      req.params.assignmentId,
    );
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    // 1. Find the student's submission
    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    if (!submission) {
      return res.status(404).send("Submission not found");
    }

    // 2. Delete file from Cloudinary
    await cloudinary.uploader.destroy(submission.publicId, {
      resource_type: "raw",
      type: "upload",
      invalidate: true,
    });

    // 3. Delete submission from MongoDB
    await Submission.findByIdAndDelete(submission._id);

    res.redirect("/student");
  }),
);

router.get(
  "/assignments/:assignmentId/download",
  isLoggedIn,
  asyncWrap(async (req, res) => {
    const studentId = req.user._id;
    const { assignmentId } = req.params;

    // 1. Find the student's submission
    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    if (!submission) {
      return res.status(404).send("Submission not found");
    }

    // 2. Download file from Cloudinary
    const fileUrl = submission.fileUrl;

    const downloadUrl = await cloudinary.url(submission.publicId, {
      resource_type: "raw",
      type: "upload",
      sign_url: true,
    });

    const response = await axios.get(downloadUrl, { responseType: "stream" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${submission.fileName}"`,
    );
    response.data.pipe(res); // Pipe the file stream to the response
  }),
);

module.exports = router;
