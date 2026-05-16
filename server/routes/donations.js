const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const haversine = require('../utils/haversine');
const { protect, authorize } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────
// URGENCY TAGGING: qty > 20 kg OR pickup within 4 hours
// ─────────────────────────────────────────────────────────────
const tagUrgency = (quantity, pickupBy) => {
  const hoursUntilPickup = (new Date(pickupBy) - new Date()) / (1000 * 60 * 60);
  return quantity > 20 || hoursUntilPickup < 4 ? 'HIGH' : 'LOW';
};

// Generate a 4-digit pickup OTP (like Ola/Uber ride confirmation)
const makePickupOtp = () => String(Math.floor(1000 + Math.random() * 9000));

// ─────────────────────────────────────────────────────────────
// SMART MATCHING ALGORITHM
// Score = 0.6 * proximityScore + 0.4 * activityScore
// proximityScore: normalised 0-100 based on distance (max 50km)
// activityScore:  deliveryCount capped at 50 → normalised to 100
// ─────────────────────────────────────────────────────────────
const runMatching = async (donation) => {
  const volunteers = await User.find({ role: 'volunteer', isAvailable: true });

  if (volunteers.length === 0) return null;

  let bestVolunteer = null;
  let bestScore = -1;
  let bestDistance = 0;

  for (const vol of volunteers) {
    // Skip if already has an active match
    const activeMatch = await Match.findOne({
      volunteer: vol._id,
      status: { $in: ['assigned', 'accepted', 'picked_up'] },
    });
    if (activeMatch) continue;

    const distanceKm = haversine(donation.location, vol.location);

    // Proximity score: 0 at 50km+, 100 at 0km
    const proximityScore = Math.max(0, (1 - distanceKm / 50)) * 100;

    // Activity score: deliveryCount capped at 50, mapped to 0-100
    const activityScore = Math.min(vol.deliveryCount, 50) * 2;

    const totalScore = 0.6 * proximityScore + 0.4 * activityScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestVolunteer = vol;
      bestDistance = distanceKm;
    }
  }

  return bestVolunteer
    ? { volunteer: bestVolunteer, score: bestScore, distanceKm: bestDistance }
    : null;
};

// ─────────────────────────────────────────────────────────────
// @route   POST /donations
// @desc    Donor submits new food donation → triggers matching
// @access  Private (donor)
// ─────────────────────────────────────────────────────────────
router.post('/', protect, authorize('donor', 'admin'), async (req, res) => {
  try {
    const { foodType, quantity, description, location, pickupBy } = req.body;

    const urgency = tagUrgency(quantity, pickupBy);
    const peopleFed = Math.round(Number(quantity) * 2);

    const donation = await Donation.create({
      donor: req.user._id,
      foodType,
      quantity,
      description,
      location,
      pickupBy,
      urgency,
      safetyChecked: req.body.safetyChecked || false,
      peopleFed,
    });

    // No automatic assignment: donations remain 'pending' until a volunteer claims
    // or an admin assigns a volunteer.

    const populated = await Donation.findById(donation._id).populate('donor', 'name email');

    res.status(201).json({ donation: populated, matched: false, volunteer: null, matchId: null });
  } catch (error) {
    console.error('POST /donations error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /donations/open
// @desc    Volunteer fetches all available (pending) donations
// @access  Private (volunteer)
// ─────────────────────────────────────────────────────────────
router.get('/open', protect, authorize('volunteer', 'admin'), async (req, res) => {
  try {
    const donations = await Donation.find({
      status: 'pending',
      pickupBy: { $gt: new Date() },
    }).populate('donor', 'name email');

    // Add distance info for this volunteer
    const withDistance = donations.map((d) => {
      const distanceKm = req.user.location
        ? haversine(d.location, req.user.location)
        : null;
      return { ...d.toObject(), distanceKm };
    });

    // Sort by urgency first, then distance
    withDistance.sort((a, b) => {
      if (a.urgency === 'HIGH' && b.urgency !== 'HIGH') return -1;
      if (b.urgency === 'HIGH' && a.urgency !== 'HIGH') return 1;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    res.json(withDistance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /donations/mine
// @desc    Donor views their own donations with match status
// @access  Private (donor)
// ─────────────────────────────────────────────────────────────
router.get('/mine', protect, authorize('donor', 'admin'), async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .sort({ createdAt: -1 })
      .populate('donor', 'name email');

    // Attach match info
    const withMatch = await Promise.all(
      donations.map(async (d) => {
        const match = await Match.findOne({ donation: d._id }).populate(
          'volunteer',
          'name email deliveryCount'
        );
        return { ...d.toObject(), match: match || null };
      })
    );

    res.json(withMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /donations/all
// @desc    Get all open donations for volunteer map view
// @access  Private (volunteer)
// ─────────────────────────────────────────────────────────────
router.get('/all', protect, async (req, res) => {
  try {
    const donations = await Donation.find({
      status: { $in: ['pending', 'matched'] },
    }).populate('donor', 'name email');
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   PATCH /donations/match/:id/accept
// @desc    Volunteer accepts their matched donation
// @access  Private (volunteer)
// ─────────────────────────────────────────────────────────────
router.patch('/match/:id/accept', protect, authorize('volunteer'), async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate('donation');
    console.log(`ℹ️ Volunteer ${req.user?._id} (${req.user?.email}) attempting to accept match ${req.params.id}`);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.volunteer.toString() !== req.user._id.toString()) {
      console.warn(`⚠️ Volunteer ${req.user._id} is not owner of match ${req.params.id} (owner=${match.volunteer})`);
      return res.status(403).json({ message: 'Not your match' });
    }

    match.status = 'accepted';
    match.acceptedAt = new Date();
    await match.save();

    res.json({ message: 'Match accepted', match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   PATCH /donations/match/:id/pickup
// @desc    Volunteer marks food as picked up
// @access  Private (volunteer)
// ─────────────────────────────────────────────────────────────
router.patch('/match/:id/pickup', protect, authorize('volunteer'), async (req, res) => {
  try {
    const { otp } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your match' });
    }

    // ── OTP verification (like Ola/Uber pickup confirmation) ──
    if (!otp) {
      return res.status(400).json({ message: 'Pickup OTP is required. Ask the donor for the code.' });
    }
    if (String(otp) !== String(match.pickupOtp)) {
      return res.status(401).json({ message: 'Incorrect pickup OTP. Please check with the donor.' });
    }

    match.status = 'picked_up';
    match.pickedUpAt = new Date();
    match.pickupOtp = null; // clear after use
    await match.save();

    await Donation.findByIdAndUpdate(match.donation, { status: 'picked_up' });

    res.json({ message: 'Pickup confirmed', match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   PATCH /donations/match/:id/deliver
// @desc    Volunteer marks donation as delivered
// @access  Private (volunteer)
// ─────────────────────────────────────────────────────────────
router.patch('/match/:id/deliver', protect, authorize('volunteer'), async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your match' });
    }

    match.status = 'delivered';
    match.deliveredAt = new Date();
    await match.save();

    // Update donation status
    const donationDoc = await Donation.findByIdAndUpdate(match.donation, { status: 'delivered' }, { new: true });

    // Increment volunteer delivery count
    await User.findByIdAndUpdate(req.user._id, { $inc: { deliveryCount: 1 } });

    // Notify donor — delivery confirmed
    if (donationDoc) {
      const peopleFed = donationDoc.peopleFed || Math.round(donationDoc.quantity * 2);
      await Notification.push(
        donationDoc.donor,
        'deliver',
        `🎉 Your "${donationDoc.foodType}" donation was delivered! ~${peopleFed} people fed. Thank you for sharing!`,
        donationDoc._id
      );
    }

    res.json({ message: 'Delivery confirmed! Thank you! 🎉', match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /donations/my-matches
// @desc    Volunteer views their assigned matches
// @access  Private (volunteer)
// ─────────────────────────────────────────────────────────────
router.get('/my-matches', protect, authorize('volunteer'), async (req, res) => {
  try {
    const matches = await Match.find({ volunteer: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email phone' },
      });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   PATCH /donations/:id/claim
// @desc    Volunteer claims a pending donation (creates a Match)
// @access  Private (volunteer)
// ─────────────────────────────────────────────────────────────
router.patch('/:id/claim', protect, authorize('volunteer'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.status !== 'pending') return res.status(400).json({ message: 'Donation not available for claim' });

    // Ensure volunteer doesn't already have an active match
    const activeMatch = await Match.findOne({ volunteer: req.user._id, status: { $in: ['assigned', 'accepted', 'picked_up'] } });
    if (activeMatch) return res.status(400).json({ message: 'You already have an active match' });

    // Prevent duplicate matches for the same donation
    const existing = await Match.findOne({ donation: donation._id });
    if (existing) return res.status(409).json({ message: 'Donation already claimed' });

    const otp = makePickupOtp();
    const match = await Match.create({
      donation: donation._id,
      volunteer: req.user._id,
      score: 0,
      distanceKm: 0,
      pickupOtp: otp,
    });
    donation.status = 'matched';
    await donation.save();

    // Notify donor their donation was claimed
    await Notification.push(
      donation.donor,
      'claim',
      `🚴 A volunteer is on their way to pick up your "${donation.foodType}" donation!`,
      donation._id
    );

    console.log(`ℹ️ Donation ${donation._id} claimed by volunteer ${req.user._id} -> match ${match._id} | Pickup OTP: ${otp}`);
    res.json({ message: 'Claim successful', match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   PATCH /donations/:id/assign
// @desc    Admin assigns a volunteer to a donation
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────
router.patch('/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { volunteerId } = req.body;
    if (!volunteerId) return res.status(400).json({ message: 'volunteerId required' });

    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.status !== 'pending') return res.status(400).json({ message: 'Donation not available for assignment' });

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') return res.status(404).json({ message: 'Volunteer not found' });

    // Prevent duplicate matches
    const existing = await Match.findOne({ donation: donation._id });
    if (existing) return res.status(409).json({ message: 'Donation already assigned/claimed' });

    const match = await Match.create({ donation: donation._id, volunteer: volunteer._id, score: 0, distanceKm: 0 });
    donation.status = 'matched';
    await donation.save();

    console.log(`ℹ️ Donation ${donation._id} assigned by admin ${req.user._id} -> volunteer ${volunteer._id} (match ${match._id})`);

    res.json({ message: 'Assigned', match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

