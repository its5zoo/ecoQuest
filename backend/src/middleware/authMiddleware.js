const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { getJwtSecret } = require('../config/secrets');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, getJwtSecret());

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database is currently offline. Please try again later.' });
      }

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found, token invalid' });
      }

      return next();
    } catch (error) {
      console.error('Auth error:', error.message);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }
      return res.status(500).json({ message: 'Server error during authorization' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = await User.findById(decoded.id).select('-password');
      }
    }
  } catch {
    // Invalid token — continue without user
  }
  next();
};

module.exports = { protect, optionalProtect };
