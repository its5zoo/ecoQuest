const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number },
  quantity: { type: Number },
  co2Generated: { type: Number, required: true }, // in kg
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
