const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /ratings
// @desc    Donor rates a volunteer after delivery (1-5 stars + optional comment)
// @access  Private (donor)
router.post('/', protect, authorize('donor', 'admin'), async (req, res) => {
  try {
    const { matchId, score, comment } = req.body;

    if (!matchId || !score) {
      return res.status(400).json({ message: 'matchId and score are required' });
    }
    if (score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be between 1 and 5' });
    }

    // Load match and verify it's delivered
    const match = await Match.findById(matchId).populate('donation');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only rate after delivery is confirmed' });
    }

    // Verify the rater is the donor of this donation
    if (match.donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the donor can rate this delivery' });
    }

    // Prevent duplicate ratings
    const existing = await Rating.findOne({ match: matchId });
    if (existing) return res.status(409).json({ message: 'Already rated this delivery' });

    const rating = await Rating.create({
      match: matchId,
      donation: match.donation._id,
      rater: req.user._id,
      ratedUser: match.volunteer,
      score,
      comment: comment || '',
    });

    // Update volunteer's avgRating and ratingCount
    const volunteer = await User.findById(match.volunteer);
    const newCount = volunteer.ratingCount + 1;
    const newAvg = ((volunteer.avgRating * volunteer.ratingCount) + score) / newCount;
    await User.findByIdAndUpdate(match.volunteer, {
      avgRating: +newAvg.toFixed(2),
      ratingCount: newCount,
    });

    // Notify volunteer they received a rating
    await Notification.push(
      match.volunteer,
      'rating',
      `⭐ You received a ${score}-star rating! "${comment || 'Great job!'}"`,
      match.donation._id
    );

    res.status(201).json({ rating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /ratings/match/:matchId
// @desc    Check if a rating exists for a given match (to avoid showing the form twice)
// @access  Private
router.get('/match/:matchId', protect, async (req, res) => {
  try {
    const rating = await Rating.findOne({ match: req.params.matchId });
    res.json({ rated: !!rating, rating: rating || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /ratings/volunteer/:id
// @desc    Get all ratings for a volunteer
// @access  Private
router.get('/volunteer/:id', protect, async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedUser: req.params.id })
      .populate('rater', 'name')
      .sort({ createdAt: -1 });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
