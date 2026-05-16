const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/authMiddleware');

const makePickupOtp = () => String(Math.floor(1000 + Math.random() * 9000));

// ─────────────────────────────────────────────────────────────
// GET /admin/all — All donations enriched with match + volunteer
// ─────────────────────────────────────────────────────────────
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ urgency: -1, createdAt: -1 })
      .populate('donor', 'name email');

    const enriched = await Promise.all(
      donations.map(async (d) => {
        const match = await Match.findOne({ donation: d._id }).populate(
          'volunteer', 'name email deliveryCount avgRating'
        );
        const timeElapsedMin = Math.floor((new Date() - new Date(d.createdAt)) / (1000 * 60));
        return { ...d.toObject(), match: match || null, timeElapsedMin };
      })
    );

    enriched.sort((a, b) => {
      if (a.urgency === 'HIGH' && b.urgency !== 'HIGH') return -1;
      if (b.urgency === 'HIGH' && a.urgency !== 'HIGH') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/stats — Enhanced dashboard stats with impact metrics
// ─────────────────────────────────────────────────────────────
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [total, pending, matched, delivered, highUrgency, volunteers, expired] =
      await Promise.all([
        Donation.countDocuments(),
        Donation.countDocuments({ status: 'pending' }),
        Donation.countDocuments({ status: { $in: ['matched', 'picked_up'] } }),
        Donation.countDocuments({ status: 'delivered' }),
        Donation.countDocuments({ urgency: 'HIGH', status: { $ne: 'delivered' } }),
        User.countDocuments({ role: 'volunteer' }),
        Donation.countDocuments({ status: 'expired' }),
      ]);

    // Impact metrics — sum quantity of all delivered donations
    const deliveredDonations = await Donation.find({ status: 'delivered' }).select('quantity peopleFed');
    const kgSaved = deliveredDonations.reduce((s, d) => s + (d.quantity || 0), 0);
    const peopleFed = deliveredDonations.reduce((s, d) => s + (d.peopleFed || Math.round(d.quantity * 2)), 0);
    const co2Saved = +(kgSaved * 2.5).toFixed(1); // 1kg food ≈ 2.5kg CO2

    res.json({ total, pending, matched, delivered, highUrgency, volunteers, expired, kgSaved: +kgSaved.toFixed(1), peopleFed, co2Saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/volunteers — All volunteers with verification status
// ─────────────────────────────────────────────────────────────
router.get('/volunteers', protect, authorize('admin'), async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /admin/volunteer/:id/verify — Toggle volunteer verification
// ─────────────────────────────────────────────────────────────
router.patch('/volunteer/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    volunteer.isVerified = !volunteer.isVerified;
    await volunteer.save();

    // Notify volunteer of status change
    await Notification.push(
      volunteer._id,
      'approve',
      volunteer.isVerified
        ? '✅ Your volunteer account has been approved! You can now claim donations.'
        : '⛔ Your volunteer account has been suspended. Contact admin for details.',
    );

    res.json({ isVerified: volunteer.isVerified, message: `Volunteer ${volunteer.isVerified ? 'approved' : 'suspended'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /admin/volunteer/create — Admin creates a volunteer account
// ─────────────────────────────────────────────────────────────
router.post('/volunteer/create', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // Pre-save hook in User model will hash the password automatically
    const volunteer = await User.create({
      name,
      email,
      password, // plain — hashed by pre-save hook
      phone: phone || '',
      role: 'volunteer',
      location: location || { lat: 0, lng: 0, address: '' },
      isVerified: true,
      isAvailable: true,
    });

    await Notification.push(
      volunteer._id,
      'approve',
      `✅ Welcome to FoodHero, ${name}! Your volunteer account has been created by an admin.`
    );

    res.status(201).json({ message: `Volunteer account created for ${name}`, volunteer: { _id: volunteer._id, name, email, role: 'volunteer' } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/export/csv — Export all donations as CSV
// ─────────────────────────────────────────────────────────────
router.get('/export/csv', protect, authorize('admin'), async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donor', 'name email')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      donations.map(async (d) => {
        const match = await Match.findOne({ donation: d._id }).populate('volunteer', 'name email');
        return { d, volunteer: match?.volunteer || null };
      })
    );

    const header = ['ID', 'Food Type', 'Quantity (kg)', 'People Fed', 'Urgency', 'Status', 'Donor Name', 'Donor Email', 'Location', 'Pickup By', 'Volunteer Name', 'Volunteer Email', 'Safety Checked', 'Posted At'];
    const rows = enriched.map(({ d, volunteer }) => [
      d._id,
      `"${d.foodType}"`,
      d.quantity,
      d.peopleFed || Math.round(d.quantity * 2),
      d.urgency,
      d.status,
      `"${d.donor?.name || ''}"`,
      d.donor?.email || '',
      `"${d.location?.address || ''}"`,
      d.pickupBy ? new Date(d.pickupBy).toISOString() : '',
      `"${volunteer?.name || ''}"`,
      volunteer?.email || '',
      d.safetyChecked ? 'Yes' : 'No',
      new Date(d.createdAt).toISOString(),
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="foodhero-donations-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /admin/donation/:id/reassign — Manual volunteer assignment
// ─────────────────────────────────────────────────────────────
router.patch('/donation/:id/reassign', protect, authorize('admin'), async (req, res) => {
  try {
    const { volunteerId } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    await Match.deleteOne({ donation: donation._id });

    const otp = makePickupOtp();
    const match = await Match.create({
      donation: donation._id,
      volunteer: volunteerId,
      score: 100,
      pickupOtp: otp,
    });

    donation.status = 'matched';
    await donation.save();

    // Notify both parties
    const volunteer = await User.findById(volunteerId).select('name');
    await Notification.push(volunteerId, 'assign',
      `📦 Admin has assigned you a donation: "${donation.foodType}" (${donation.quantity}kg)`,
      donation._id
    );
    await Notification.push(donation.donor, 'assign',
      `🚴 A volunteer (${volunteer?.name}) has been assigned to your donation.`,
      donation._id
    );

    console.log(`ℹ️ Admin reassigned donation ${donation._id} → volunteer ${volunteerId} | OTP: ${otp}`);
    res.json({ message: 'Reassigned successfully', match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
