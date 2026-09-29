const express = require('express');
const mongoose = require('mongoose');
const router = express.Router({mergeParams: true});//help to join the the partent and child routes
const ExpressError = require('../ExpressError');
const { loginSchema } = require('../schema');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("../models/users.js");
passport.use(User.createStrategy());
const path = require('path');
const Batch = require('../models/batch');

router.use(express.static(path.join(__dirname, 'views')));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}



function asyncWrap(func) {
    return (req, res, next) => {
        Promise.resolve(func(req, res, next)).catch(next);
    };
}

function validateLogin(req, res, next) {
    const result = loginSchema.validate(req.body);

    if (result.error) {
        return next(new ExpressError(400, result.error.details[0].message));
    }

    next();
}

function isTeacher(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  if (req.user.role !== "teacher") {
    return res.status(403).send("Access denied");
  }

  next();
}

router.get('/login', asyncWrap(async (req, res) => {
    res.render('pages/login');
}));

router.get('/signup', asyncWrap(async (req, res) => {
    res.render('pages/signup');
}));

router.post('/login', validateLogin, asyncWrap(async (req, res,next) => {
    const authMiddleware = passport.authenticate("local",(err, user, info) => {

      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).send(info.message);
    }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

      // Check user's role
        // if (user.role === "admin") {
        //   return res.redirect("/admin");
        // }

        if (user.role === "teacher") {
          return res.redirect("/dashboard");
          
        }
        // if (user.role === "student") {
        //   return res.redirect("/student");
        // }

        // Unknown role
        return res.status(403).send("Invalid user role");
      });
    });

    authMiddleware(req, res, next);

}));

router.post('/signup', asyncWrap(async (req, res) => {
    
   const { name, email, password,confirm_password, role } = req.body;
  
    if (password !== confirm_password) {
       return res.status(400).send("Passwords do not match");
    }

    if (role === "admin") {
      const existingAdmin = await User.findOne({
        role: "admin"
      });

      if (existingAdmin) {
        return res.status(403).send("Admin already exists");
      }
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already registered");
    }

    const user = new User({name,email,role});

    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }

      if (registeredUser.role === "admin") {
        return res.redirect("/admin");
      }

      if (registeredUser.role === "teacher") {
        return res.redirect("/dashboard");
      }

      res.redirect("/student");
    });

}));

router.get('/logout', asyncWrap(async (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        req.flash('success', 'You have been logged out.');
        res.redirect('/login');
    });
}));

router.get('/dashboard', isTeacher, asyncWrap(async (req, res) => {
    if (req.user.role == "teacher") {
      res.render("./teacher/dashboard");
    }
}));

router.get('/batch', isTeacher, asyncWrap(async (req, res) => {
  if (req.user.role == "teacher") {
    const batches = await Batch.find({ teacher: req.user._id }).populate('students');
    res.render("teacher/batch", { batches });
  }
}));

router.post('/batch', isTeacher, asyncWrap(async (req, res) => {
  const { name, time, period, duration } = req.body;
  const timing = `${time} ${period}`;
  const batch = new Batch({ name, timing, duration, teacher: req.user._id, students: [] });
  await batch.save();
  req.flash('success', 'Batch created');
  res.redirect('/batch');
}));

router.get('/teacher/batches/:batchId/students', isTeacher, asyncWrap(async (req, res) => {
  const batch = await Batch.findOne({
    _id: req.params.batchId,
    teacher: req.user._id
  }).populate("students", "name email");

  if (!batch) {
    return res.status(404).send("Batch not found");
  }

  let student = null;// this is because before search in this page student will not there.
  if (req.query.studentId) {
    student = await User.findById(req.query.studentId).select('name email');
  }

  res.render("teacher/students", { batch, student });
}));

router.post(
  '/teacher/batches/:batchId/students/search',
  isTeacher,
  asyncWrap(async (req, res) => {

    const { email } = req.body;

    const batch = await Batch.findOne({
      _id: req.params.batchId,
      teacher: req.user._id
    }).populate("students", "name email");

    if (!batch) {
      return res.status(404).send("Batch not found");
    }

    const student = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "student"
    });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    res.render("teacher/students", {
      batch,
      student
    });
  })
);

router.post(
  '/teacher/batches/:batchId/students/:studentId/add',
  isTeacher,
  asyncWrap(async (req, res) => {
      let {batchId,studentId} = req.params;

      console.log(batchId,studentId);
      let batch = await Batch.findOne({_id: batchId});
      if (batch.students.includes(studentId)) {
        return res.status(400).send("Student already exists in this batch");
      }

      batch.students.push(studentId);

      await batch.save();


      res.render("/teacher/students");


  })
);
module.exports = router;