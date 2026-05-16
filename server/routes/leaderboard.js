const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const BADGE_TIERS = [
  { label: '🌟 Legend',   minDeliveries: 100, color: '#fbbf24' },
  { label: '🥇 Gold',     minDeliveries: 50,  color: '#f59e0b' },
  { label: '🥈 Silver',   minDeliveries: 20,  color: '#94a3b8' },
  { label: '🥉 Bronze',   minDeliveries: 5,   color: '#b87333' },
  { label: '🌱 Newcomer', minDeliveries: 0,   color: '#16a34a' },
];

const getBadge = (deliveryCount) =>
  BADGE_TIERS.find((t) => deliveryCount >= t.minDeliveries) || BADGE_TIERS.at(-1);

// @route   GET /leaderboard
// @desc    Top volunteers ranked by deliveries + badge tier
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer', isVerified: true })
      .select('name deliveryCount avgRating ratingCount location isAvailable')
      .sort({ deliveryCount: -1 })
      .limit(20);

    const ranked = volunteers.map((v, i) => ({
      rank: i + 1,
      _id: v._id,
      name: v.name,
      deliveryCount: v.deliveryCount,
      avgRating: v.avgRating,
      ratingCount: v.ratingCount,
      isAvailable: v.isAvailable,
      badge: getBadge(v.deliveryCount),
    }));

    // Platform totals for the banner
    const allVolunteers = await User.find({ role: 'volunteer' }).select('deliveryCount avgRating');
    const totalDeliveries = allVolunteers.reduce((s, v) => s + v.deliveryCount, 0);
    const avgPlatformRating =
      allVolunteers.filter((v) => v.ratingCount > 0).reduce((s, v) => s + v.avgRating, 0) /
        (allVolunteers.filter((v) => v.ratingCount > 0).length || 1);

    res.json({ ranked, totalDeliveries, avgPlatformRating: +avgPlatformRating.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
