const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
    },
    quantity: {
      type: Number, // in kg
      required: [true, 'Quantity is required'],
      min: 0.1,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    pickupBy: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
    },
    // AUTO-TAGGED: HIGH if qty > 20kg OR pickupBy within 4 hours
    urgency: {
      type: String,
      enum: ['HIGH', 'LOW'],
      default: 'LOW',
    },
    status: {
      type: String,
      enum: ['pending', 'matched', 'picked_up', 'delivered', 'expired'],
      default: 'pending',
    },
    // Donor confirms food is safe before posting
    safetyChecked: {
      type: Boolean,
      default: false,
    },
    // Estimated people fed (quantity kg * 2)
    peopleFed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
