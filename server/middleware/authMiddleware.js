const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to request
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }

    try {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        // Token is valid but user was deleted (e.g., after re-seeding)
        return res.status(401).json({ message: 'Session expired — please log in again' });
      }
      req.user = user;
      next();
    } catch (dbError) {
      return res.status(500).json({ message: 'Server error during authentication' });
    }
  });
};

// Role-based access guard
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied for role '${req.user.role}'`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
