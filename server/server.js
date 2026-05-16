require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const { startExpireJob } = require('./jobs/expireJob');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (required by passport — minimal, JWT handles real auth)
app.use(session({
  secret: process.env.JWT_SECRET || 'foodhero_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 5 * 60 * 1000 }, // 5 min — only for OAuth flow
}));
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/donations', require('./routes/donations'));
app.use('/admin', require('./routes/admin'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/notifications', require('./routes/notifications'));
app.use('/ratings', require('./routes/ratings'));
app.use('/applications', require('./routes/applications'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5001;

(async () => {
  await connectDB();
  startExpireJob();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  GOOGLE_CLIENT_ID not set — Google OAuth is disabled');
    }
  });
})();
