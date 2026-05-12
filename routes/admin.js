const express = require('express');
const router = express.Router();
const User = require('../models/User');

// middleware: admin only
function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  res.status(403).json({ error: 'Admin access required' });
}

// get all users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password -twoFactorSecret');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update user role
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;