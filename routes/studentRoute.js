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


function asyncWrap(func) {
    return (req, res, next) => {
        Promise.resolve(func(req, res, next)).catch(next);
    };
}

router.get("/student", asyncWrap(async (req, res) => {

  const stud_id = req.user._id;

  const batches = await Batch.find({
    students: stud_id
  });

  const info = {
    name: req.user.name,
    batches: batches
  };

  res.render("./student/dashboard", { info });
}));

router.get('/student/:batchId/task', asyncWrap(async (req, res) => {
    const batchId =  req.params;
     res.render("./student/dailyTask");
}))
module.exports = router;