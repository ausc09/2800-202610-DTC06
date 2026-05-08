const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
require("./config/passport");
const savedRoutes = require("./routes/saved");

const app = express();
const PORT = process.env.PORT || 3000;
const plantRoutes = require("./routes/plantRoutes");
const authRoutes = require("./routes/auth");

// connect database
function connectDB() {
  return mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error(err));
}

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

async function main() {
  await connectDB();

  app.set("view engine", "ejs");
  app.use(express.static("public"));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // CSP
  app.use((req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    next();
  });

  // Session
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax",
      },
    }),
  );

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use(plantRoutes);
  app.use("/saved", savedRoutes);

  app.get("/", (req, res) => {
    res.redirect("/welcome");
  });

  app.get("/map", (req, res) => {
    res.render("map", { user: req.user || null });
  });

  app.get("/welcome", (req, res) => res.render("welcome"));
  app.get("/login", (req, res) => res.render("login"));
  app.get("/signup", (req, res) => res.render("signup"));

  app.get("/profile", requireLogin, (req, res) => {
    res.render("profile", { user: req.user });
  });

  app.use("/auth", authRoutes);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main();
