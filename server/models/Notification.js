const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['claim', 'deliver', 'assign', 'expire', 'rating', 'approve'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedDonation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
  },
  { timestamps: true }
);

// Helper: create a notification easily
notificationSchema.statics.push = async function (userId, type, message, relatedDonation = null) {
  try {
    await this.create({ user: userId, type, message, relatedDonation });
  } catch (e) {
    console.warn('Notification push failed:', e.message);
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
