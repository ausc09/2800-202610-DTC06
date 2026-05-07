const express = require("express");
const router = express.Router();
const passport = require("passport");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");

//signup
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: "Email already registered" });

    const user = new User({ firstName, lastName, email, password });
    await user.save();

    req.login(user, (err) => {
      if (err)
        return res.status(500).json({ error: "Login after signup failed" });
      return res.json({ message: "Signup successful" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });

    req.login(user, (err) => {
      if (err) return next(err);

      // Remember me
      if (req.body.rememberMe) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30天
      } else {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24; // 1天
      }

      if (user.twoFactorEnabled) {
        req.session.twoFactorPassed = false;
        return res.json({ requires2FA: true });
      }
      req.session.twoFactorPassed = true;
      res.json({
        message: "Login successful",
        user: { id: user._id, email: user.email, role: user.role },
      });
    });
  })(req, res, next);
});

// logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    req.session.destroy();
    res.json({ message: "Logged out" });
  });
});

// current user info
router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });
  const { _id, firstName, lastName, email, role, twoFactorEnabled } = req.user;
  res.json({ id: _id, firstName, lastName, email, role, twoFactorEnabled });
});

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/");
  },
);

module.exports = router;
