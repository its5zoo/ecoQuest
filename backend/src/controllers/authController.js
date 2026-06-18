const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OAuthCode = require('../models/OAuthCode');
const { getJwtSecret } = require('../config/secrets');
const { validateSignup, validateLogin, sanitizeProfileUpdates } = require('../utils/validate');

const generateToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), { expiresIn: '7d' });

const buildUserPayload = (user) => ({
  _id:            user._id,
  name:           user.name,
  email:          user.email,
  district:       user.district,
  state:          user.state,
  country:        user.country,
  avatar:         user.avatar,
  bio:            user.bio,
  xp:             user.xp,
  level:          user.level,
  streak:         user.streak,
  carbonSaved:    user.carbonSaved,
  totalCarbonKg:  user.totalCarbonKg,
  globalRank:     user.globalRank,
  stateRank:      user.stateRank,
  districtRank:   user.districtRank,
  badges:         user.badges,
  registeredFrom: user.registeredFrom,
  createdAt:      user.createdAt,
});

const registerUser = async (req, res) => {
  try {
    const validation = validateSignup(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.errors.join('. ') });
    }

    const {
      name, email, password, district, state, country,
      registeredFrom, deviceId,
    } = req.body;

    const normalizedEmail = String(email).trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      district: String(district).trim(),
      state: String(state).trim(),
      country: country || 'India',
      registeredFrom: registeredFrom || 'unknown',
      deviceId: deviceId || '',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: buildUserPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

const loginUser = async (req, res) => {
  try {
    const validation = validateLogin(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.errors.join('. ') });
    }

    const { email, password, registeredFrom, deviceId } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail })
      .select('+password')
      .populate('badges');

    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.lastActive = new Date();
    if (registeredFrom) user.registeredFrom = registeredFrom;
    if (deviceId) user.deviceId = deviceId;
    await user.save();

    return res.status(200).json({
      message: 'Login successful',
      user: buildUserPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

const exchangeOAuthCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'OAuth code is required' });
    }

    // findOneAndDelete — atomic consume (returns null if code not found / expired)
    const doc = await OAuthCode.consume(code.trim());
    if (!doc) {
      // Code was already consumed (e.g. React StrictMode double-request) or expired
      return res.status(401).json({ message: 'Invalid or expired sign-in code. Please try signing in again.' });
    }

    const user = await User.findById(doc.userId).populate('badges');
    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please sign up.' });
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    return res.status(200).json({
      user:  buildUserPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('OAuth exchange error:', error.message, error.stack);
    return res.status(500).json({ message: 'Sign-in failed. Please try again or use email/password.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('badges');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(buildUserPayload(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const updates = sanitizeProfileUpdates(req.body);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('badges');

    const postUpdates = {};
    if (updates.name !== undefined) postUpdates.userName = updates.name;
    if (updates.avatar !== undefined) postUpdates.userAvatar = updates.avatar;
    if (updates.district !== undefined) postUpdates.district = updates.district;
    if (updates.state !== undefined) postUpdates.state = updates.state;
    if (updates.country !== undefined) postUpdates.country = updates.country;

    if (Object.keys(postUpdates).length > 0) {
      const Post = require('../models/Post');
      await Post.updateMany({ user: req.user._id }, { $set: postUpdates });
    }

    return res.status(200).json(buildUserPayload(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, exchangeOAuthCode, getMe, updateMe, generateToken, buildUserPayload };
