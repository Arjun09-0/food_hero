require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const { startExpireJob } = require('./jobs/expireJob');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// CORS — allow localhost in dev, Render URL in prod
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL, // set this in Render env vars
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (required by passport — minimal, JWT handles real auth)
app.use(session({
  secret: process.env.JWT_SECRET || 'foodhero_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, maxAge: 5 * 60 * 1000 }, // 5 min — only for OAuth flow
}));
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API Routes
app.use('/auth', require('./routes/auth'));
app.use('/donations', require('./routes/donations'));
app.use('/admin', require('./routes/admin'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/notifications', require('./routes/notifications'));
app.use('/ratings', require('./routes/ratings'));
app.use('/applications', require('./routes/applications'));

// ── Serve built React client in production ──────────
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  // Catch-all: let React Router handle client-side routes
  app.get('/*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });
}

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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  GOOGLE_CLIENT_ID not set — Google OAuth disabled');
    }
  });
})();
