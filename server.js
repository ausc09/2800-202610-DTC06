const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
require("./config/passport");
const savedRoutes = require("./routes/saved");
const reviewRoutes = require("./routes/reviewRoutes");
const Review = require("./models/review");

const app = express();
const PORT = process.env.PORT || 3000;
const plantRoutes = require("./routes/plantRoutes");
const authRoutes = require("./routes/auth");
const aiTipRoutes = require("./routes/aiTip");
const seedRoutes = require("./routes/seedRoutes");

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
  app.use(express.json({ limit: "10mb" }));

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
  app.use("/saved", savedRoutes);
  app.use(plantRoutes);
  app.use(seedRoutes);
  app.use(reviewRoutes);
  app.use("/api", requireLogin, aiTipRoutes);
  app.use("/reviews", requireLogin, reviewRoutes);

  app.get("/", (req, res) => {
    res.redirect("/welcome");
  });

  app.get("/map", (req, res) => {
    res.render("map", { user: req.user || null });
  });

  app.get("/welcome", (req, res) => res.render("welcome"));
  app.get("/login", (req, res) => res.render("login"));
  app.get("/signup", (req, res) => res.render("signup"));
  app.get("/setup-2fa", requireLogin, (req, res) => res.render("setup-2fa"));
  app.get("/verify-2fa", requireLogin, (req, res) => res.render("verify-2fa"));
  app.get("/admin", requireLogin, (req, res) => {
    if (req.user.role !== "admin") return res.redirect("/");
    res.render("admin");
  });

  app.get("/profile", requireLogin, async (req, res) => {
    try {
      const User = require("./models/User");
      const ViewHistory = require("./models/viewHistory");

      const freshUser = await User.findById(req.user._id).lean();
      const reviewCount = await Review.countDocuments({ userId: req.user._id });
      const plantsSaved = freshUser.favoritePlants?.length || 0;

      // recent 3 view history
      const activities = await ViewHistory.find({ userId: req.user._id })
        .sort({ viewedAt: -1 })
        .limit(3)
        .lean();

      res.render("profile", {
        user: freshUser,
        reviewCount,
        plantsSaved,
        activities,
      });
    } catch (err) {
      console.error(err);
      res.render("profile", {
        user: req.user,
        reviewCount: 0,
        plantsSaved: 0,
        activities: [],
      });
    }
  });

  app.use("/auth", authRoutes);
  app.use("/admin", require("./routes/admin"));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main();
