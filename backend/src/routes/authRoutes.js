const express  = require('express');
const router   = express.Router();
const passport = require('../config/passport');
const OAuthCode = require('../models/OAuthCode');
const { configured } = require('../config/passport');
const { registerUser, loginUser, exchangeOAuthCode, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const FRONTEND = process.env.FRONTEND_URL || 'https://ecoquesteits5zoo.up.railway.app';

router.post('/signup', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/oauth/exchange', authLimiter, exchangeOAuthCode);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

const issueCodeRedirect = async (req, res) => {
  try {
    const code = await OAuthCode.createForUser(req.user._id);
    res.redirect(`${FRONTEND}/oauth-callback?code=${code}`);
  } catch (err) {
    console.error('OAuth code issue error:', err);
    res.redirect(`${FRONTEND}/login?error=oauth_code_failed`);
  }
};

const guardProvider = (provider) => (req, res, next) => {
  if (!configured[provider]) {
    return res.redirect(`${FRONTEND}/login?error=${provider}_not_configured`);
  }
  next();
};

router.get('/google',
  guardProvider('google'),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  guardProvider('google'),
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND}/login?error=google_failed`,
  }),
  issueCodeRedirect
);

router.get('/oauth-status', (req, res) => {
  res.json({ google: configured.google });
});

module.exports = router;
