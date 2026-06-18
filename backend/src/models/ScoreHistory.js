const mongoose = require('mongoose');

const scoreHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  dailyCarbon: { type: Number, default: 0 },
  dailyScore: { type: Number, default: 100 },
  xpEarned: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ScoreHistory', scoreHistorySchema);
