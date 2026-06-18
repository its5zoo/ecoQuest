const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, select: false },

  // OAuth provider IDs
  googleId:     { type: String, default: '' },
  facebookId:   { type: String, default: '' },

  // Location
  district:     { type: String, required: true },
  state:        { type: String, required: true },
  country:      { type: String, required: true, default: 'India' },

  // Avatar / Profile
  avatar:       { type: String, default: '' },
  bio:          { type: String, default: '' },

  // Gamification
  xp:           { type: Number, default: 0, min: 0 },
  level:        { type: Number, default: 1, min: 1 },
  streak:       { type: Number, default: 0, min: 0 },
  lastActive:   { type: Date, default: Date.now },

  // Carbon tracking
  totalCarbonKg:  { type: Number, default: 0, min: 0 },  // total CO2 logged
  carbonSaved:    { type: Number, default: 0, min: 0 },  // kg saved vs baseline

  // Leaderboard rank snapshot (updated periodically)
  globalRank:     { type: Number, default: null },
  stateRank:      { type: Number, default: null },
  districtRank:   { type: Number, default: null },

  // Badges & social
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],

  // Device / registration metadata
  registeredFrom: { type: String, default: 'unknown' }, // e.g. "android", "web", "ios"
  deviceId:       { type: String, default: '' },

}, { timestamps: true });

// Index for fast leaderboard queries
userSchema.index({ xp: -1 });
userSchema.index({ state: 1, xp: -1 });
userSchema.index({ district: 1, xp: -1 });

module.exports = mongoose.model('User', userSchema);
