const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  criteria: {
    type: { type: String, enum: ['streak', 'carbonSaved', 'questsCompleted', 'level'], required: true },
    threshold: { type: Number, required: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
