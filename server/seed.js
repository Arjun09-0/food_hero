require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Donation = require('./models/Donation');
const Match = require('./models/Match');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Donation.deleteMany({});
    await Match.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // 4-digit pickup OTP generator
    const makePickupOtp = () => String(Math.floor(1000 + Math.random() * 9000));

    // ── Create Users ──────────────────────────────────────────
    // Admin
    const admin = await User.create({
      name: 'Priya Admin',
      email: 'admin@foodhero.org',
      password: 'admin123',
      phone: '+91 98765 00001',
      role: 'admin',
      location: { lat: 12.9716, lng: 77.5946, address: 'Bangalore City Centre' },
    });

    // Donor
    const donor = await User.create({
      name: 'Raj Sharma (Wedding Hall)',
      email: 'donor@foodhero.org',
      password: 'donor123',
      phone: '+91 98765 43210',
      role: 'donor',
      location: { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' },
    });

    // Volunteer 1 — Close, experienced
    const volunteer1 = await User.create({
      name: 'Arjun Volunteer',
      email: 'vol1@foodhero.org',
      password: 'vol123',
      phone: '+91 91234 56789',
      role: 'volunteer',
      deliveryCount: 15,
      location: { lat: 12.938, lng: 77.626, address: 'HSR Layout, Bangalore' },
    });

    // Volunteer 2 — Farther, less experienced
    const volunteer2 = await User.create({
      name: 'Meena Helper',
      email: 'vol2@foodhero.org',
      password: 'vol123',
      phone: '+91 90000 12345',
      role: 'volunteer',
      deliveryCount: 3,
      location: { lat: 12.98, lng: 77.58, address: 'Indiranagar, Bangalore' },
    });

    console.log('👥 Created 1 admin, 1 donor, 2 volunteers');

    // ── Create Donations ───────────────────────────────────────
    // HIGH urgency: 50 kg biryani, pickup in 2 hours
    const pickupSoon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const donation1 = await Donation.create({
      donor: donor._id,
      foodType: 'Biryani & Sweets',
      quantity: 50,
      description: 'From a wedding event — biryani, sweets, fruits. Very fresh.',
      location: { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' },
      pickupBy: pickupSoon,
      urgency: 'HIGH',
      status: 'pending',
    });

    // LOW urgency: 10 kg rice, pickup in 8 hours
    const pickupLater = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const donation2 = await Donation.create({
      donor: donor._id,
      foodType: 'Rice & Dal',
      quantity: 10,
      description: 'Office canteen leftovers — rice, dal, roti.',
      location: { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' },
      pickupBy: pickupLater,
      urgency: 'LOW',
      status: 'matched',
    });

    // Auto-match donation2 to volunteer1 (closest + experienced)
    const demoOtp = makePickupOtp();
    await Match.create({
      donation: donation2._id,
      volunteer: volunteer1._id,
      score: 82.5,
      distanceKm: 0.4,
      status: 'accepted',
      acceptedAt: new Date(),
      pickupOtp: demoOtp,
    });

    console.log(`🔢 Demo pickup OTP for matched donation: [ ${demoOtp} ] (donor sees this, volunteer enters it)`);

    console.log('🍱 Created 2 demo donations (1 HIGH urgency pending, 1 LOW matched)');

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETE — Demo credentials:');
    console.log('═══════════════════════════════════════════════════');
    console.log('Admin:     admin@foodhero.org    / admin123');
    console.log('Donor:     donor@foodhero.org    / donor123');
    console.log('Volunteer: vol1@foodhero.org     / vol123');
    console.log('Volunteer: vol2@foodhero.org     / vol123');
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
