const cron = require('node-cron');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

/**
 * Runs every 5 minutes.
 * Marks donations as 'expired' if their pickupBy deadline has passed
 * and they are still pending or matched (not already delivered or expired).
 */
const startExpireJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const expired = await Donation.find({
        status: { $in: ['pending', 'matched'] },
        pickupBy: { $lt: now },
      });

      if (expired.length === 0) return;

      for (const donation of expired) {
        donation.status = 'expired';
        await donation.save();

        // Notify donor their donation expired
        await Notification.push(
          donation.donor,
          'expire',
          `⏰ Your donation "${donation.foodType}" has expired and was not picked up in time.`,
          donation._id
        );

        console.log(`⏰ Donation ${donation._id} (${donation.foodType}) marked as expired.`);
      }

      console.log(`⏰ Expire job: ${expired.length} donation(s) expired at ${now.toISOString()}`);
    } catch (err) {
      console.error('Expire job error:', err.message);
    }
  });

  console.log('⏰ Auto-expire cron job started (every 5 minutes)');
};

module.exports = { startExpireJob };
