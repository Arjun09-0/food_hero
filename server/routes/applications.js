const express = require('express');
const router = express.Router();
const VolunteerApplication = require('../models/VolunteerApplication');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /applications
// @desc    Public: anyone can apply to become a volunteer
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Prevent duplicate pending applications
    const existing = await VolunteerApplication.findOne({ email, status: 'pending' });
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending application.' });
    }

    const application = await VolunteerApplication.create({ name, email, phone, message });

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await Notification.push(
        admin._id,
        'approve',
        `📋 New volunteer application from ${name} (${email})`,
      );
    }

    res.status(201).json({ message: 'Application submitted! An admin will review it shortly.', application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /applications
// @desc    Admin: view all volunteer applications
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const applications = await VolunteerApplication.find()
      .sort({ createdAt: -1 });
    const pendingCount = applications.filter((a) => a.status === 'pending').length;
    res.json({ applications, pendingCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /applications/:id/reject
// @desc    Admin: reject an application
// @access  Private (admin)
router.patch('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const app = await VolunteerApplication.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', reviewedBy: req.user._id },
      { new: true }
    );
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Application rejected', application: app });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /applications/:id/approve
// @desc    Admin: approve application — creates volunteer account
// @access  Private (admin)
router.post('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { password, lat, lng } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'A password is required to create the volunteer account' });
    }

    const application = await VolunteerApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'pending') {
      return res.status(400).json({ message: `Application is already ${application.status}` });
    }

    // Check email not already registered
    const existing = await User.findOne({ email: application.email });
    if (existing) {
      return res.status(409).json({ message: 'This email is already registered as a user.' });
    }

    // Create volunteer account (pre-save hook hashes password)
    const volunteer = await User.create({
      name: application.name,
      email: application.email,
      password,
      phone: application.phone || '',
      role: 'volunteer',
      location: { lat: Number(lat) || 0, lng: Number(lng) || 0, address: `${lat}, ${lng}` },
      isVerified: true,
      isAvailable: true,
    });

    // Mark application approved
    application.status = 'approved';
    application.reviewedBy = req.user._id;
    await application.save();

    // Send welcome notification
    await Notification.push(
      volunteer._id,
      'approve',
      `✅ Welcome to FoodHero, ${application.name}! Your volunteer account has been approved.`
    );

    res.status(201).json({
      message: `Volunteer account created for ${application.name}`,
      volunteer: { _id: volunteer._id, name: volunteer.name, email: volunteer.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
