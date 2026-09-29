if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const app = express();
const ExpressError = require('./ExpressError');
const {loginSchema }= require('./schema.js');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/users.js");
passport.use(User.createStrategy());

const routes = require('./routes/userRoute.js');
const studentRoutes = require('./routes/studentRoute.js');

function asyncWrap(func) {
  return (req,res,next) => {
    func(req,res,next).catch(next);
  }
}

async function main() {
  try {
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log("MongoDB connected successfully");

    // await createAdminIfNotExists();

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.log(err);
  }
}

main();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());



const sessionOptions = {
  secret : process.env.SESSION_SECRET, 
  resave : false, 
  saveUninitialized : true, 
  cookie : { maxAge : 1000 * 60 * 60 * 24  }
}

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(flash());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middlewares

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

//joi validation
const validateLogin = (req,res,next) => {
     let result = loginSchema.validate(req.body);
    if(result.error) {
        next( new ExpressError(400,result.error.details[0].message));
    }
    next();
}







app.use("/", routes);
app.use("/", studentRoutes);



app.get("/", isLoggedIn, asyncWrap( async(req,res) => {
    res.render("pages/home");
}));





app.use((error,req,res,next) => {
     const {status,message,name} = error;
     res.render("error.ejs", {status,message,name});
    console.log(error);
})

app.listen(8080, (req,res) => {
    console.log('Server is running on port 8080');
})