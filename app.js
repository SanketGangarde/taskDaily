if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const app = express();
const ExpressError = require('./ExpressError');

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


app.get("/", asyncWrap( async(req,res) => {
    res.render("pages/home");
}));

app.get("/login",asyncWrap( async (req,res) => {
    res.render("pages/login");
}) );

app.get("/signup",asyncWrap( async(req,res) => {
    res.render("pages/signup");
}));

app.post("/login", asyncWrap( async (req,res) => {
    const {username, password} = req.body;
    console.log(username, password);
    res.redirect("/");
}));

app.post("/signup",asyncWrap( async(req,res) => {
    const {username,email,password,confirm_password} = req.body;
    console.log(username, email, password, confirm_password);
    res.redirect("/");
}));



app.use((error,req,res,next) => {
     const {status,message,name} = error;
     res.status(status).send(name + ": " + message);
})

app.listen(8080, (req,res) => {
    console.log('Server is running on port 8080');
})