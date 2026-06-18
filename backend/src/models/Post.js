const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  scope: {
    type: String,
    enum: ['State', 'Country'],
    required: true
  },
  district: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'India'
  }
}, { timestamps: true });

// Index for query optimization
postSchema.index({ scope: 1, createdAt: -1 });
postSchema.index({ district: 1, createdAt: -1 });
postSchema.index({ state: 1, createdAt: -1 });

// TTL Index to automatically delete posts after 2 days (172800 seconds)
postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

module.exports = mongoose.model('Post', postSchema);
