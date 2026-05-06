const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
require("./config/passport");

const app = express();
const PORT = process.env.PORT || 3000;

// connect database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CSP
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
});

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login")
}

// Routes
const plantRoutes = require("./routes/plantRoutes");
app.use(plantRoutes);

app.get("/", (req, res) => {
  res.redirect("/welcome");
});

app.get("/map", (req, res) => {
  res.render("map", { userPlaceholder: "UserPlaceHolder" });
});

app.get("/welcome", (req, res) => res.render("welcome"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));

app.get("/saved",   requireLogin, (req, res) => res.render("saved"));
app.get("/profile", requireLogin, (req, res) => res.render("profile"));

app.use("/auth", require("./routes/auth"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});