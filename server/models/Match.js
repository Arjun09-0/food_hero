const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      unique: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number, // matching score used to select this volunteer
      default: 0,
    },
    distanceKm: {
      type: Number, // distance at time of match
      default: 0,
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'picked_up', 'delivered', 'declined'],
      default: 'assigned',
    },
    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    // 4-digit OTP the donor shares with the volunteer at pickup (like Ola/Uber)
    pickupOtp: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
