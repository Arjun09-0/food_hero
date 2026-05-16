const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5001'}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        // Look up by email — works for donor, volunteer, and admin
        let user = await User.findOne({ email });

        if (user) {
          // Existing user: login with their actual role (volunteer stays volunteer, etc.)
          // Block admin from OAuth — admin must use email+password only
          if (user.role === 'admin') {
            return done(new Error('Admin accounts must sign in with email and password.'), null);
          }
          console.log(`✅ OAuth: ${user.role} signed in via Google — ${email}`);
          return done(null, user);
        }

        // New user — only create as donor; volunteers are created by admin
        user = await User.create({
          name: profile.displayName,
          email,
          password: `google_oauth_${profile.id}`, // placeholder — never used for direct login
          role: 'donor',
          location: { lat: 0, lng: 0, address: '' },
          isVerified: true,
        });
        console.log(`✅ OAuth: New donor account created — ${email}`);
        return done(null, user);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Minimal session support (only used during the OAuth redirect flow)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
