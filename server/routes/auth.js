const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @route   POST /auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;
    // Public registration is donor-only. Volunteers are created by admin, admin is seed-only.
    const role = 'donor';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: role || 'donor',
      location: location || { lat: 0, lng: 0, address: '' },
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /auth/login
// @desc    Login — validates credentials, returns JWT immediately (no OTP step)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      deliveryCount: user.deliveryCount,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /auth/me
// @desc    Get current logged-in user profile
// @access  Private
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route   PATCH /auth/availability
// @desc    Volunteer toggles their availability status
// @access  Private (volunteer)
router.patch('/availability', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ isAvailable: user.isAvailable, message: user.isAvailable ? 'You are now Online 🟢' : 'You are now Offline 🔴' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Google OAuth ─────────────────────────────────────────────
// These routes only work if GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET are set in .env
const passport = require('../config/passport');

// @route GET /auth/google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// @route GET /auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed` }),
  (req, res) => {
    // Issue JWT and redirect to frontend callback page
    const token = generateToken(req.user._id);
    const { role, name } = req.user;
    const frontend = process.env.CLIENT_URL || 'http://localhost:5173';
    const redirectUrl = `${frontend}/oauth-callback?token=${token}&role=${role}&name=${encodeURIComponent(name)}`;
    res.redirect(redirectUrl);
  }
);

module.exports = router;
