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
      console.log('twoFactorEnabled:', user.twoFactorEnabled);
      console.log('user:', user);

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

//update profile
router.put('/update-profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ error: 'Name cannot be empty' });

    await User.findByIdAndUpdate(req.user._id, { firstName, lastName });
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    if (req.user.twoFactorEnabled) {
      req.session.twoFactorPassed = false;
      return res.redirect('/verify-2fa');
    }
    req.session.twoFactorPassed = true;
    res.redirect("/");
  },
);

router.get('/2fa/setup', async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `PlantSafe (${req.user.email})` });
  req.session.tempSecret = secret.base32;
  const qrDataURL = await QRCode.toDataURL(secret.otpauth_url);
  res.json({ qr: qrDataURL, secret: secret.base32 });
});

router.post('/2fa/enable', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { token } = req.body;
    const verified = speakeasy.totp.verify({
      secret: req.session.tempSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) return res.status(400).json({ error: 'Invalid code. Try again.' });

    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: req.session.tempSecret,
      twoFactorEnabled: true,
    });
    delete req.session.tempSecret;
    req.session.twoFactorPassed = true;
    res.json({ message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2FA verify
router.post('/2fa/verify', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { token } = req.body;
    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) return res.status(400).json({ error: 'Invalid code' });
    req.session.twoFactorPassed = true;
    res.json({ message: '2FA verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2FA disable
router.post('/2fa/disable', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    res.json({ message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
