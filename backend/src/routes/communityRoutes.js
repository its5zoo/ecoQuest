const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');
const spamLimiter = require('../middleware/spamLimiter');

// Get all posts (filtered by scope) and create new post (moderated)
router.route('/posts')
  .get(protect, getPosts)
  .post(protect, spamLimiter({ maxRequests: 3, windowMs: 60000, actionName: 'posts' }), createPost);

module.exports = router;
