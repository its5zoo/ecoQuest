const Post = require('../models/Post');
const AIService = require('../services/aiService');

// @route   POST /api/community/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content, scope } = req.body;

    if (!content || !scope) {
      return res.status(400).json({ success: false, message: 'Content and scope are required' });
    }

    if (!['State', 'Country'].includes(scope)) {
      return res.status(400).json({ success: false, message: 'Invalid scope value' });
    }

    // Moderate the post using Gemini AI
    const check = await AIService.moderatePost(content);

    if (!check.isValid) {
      return res.status(400).json({
        success: false,
        isModerationFailure: true,
        message: check.reason || 'Post content violated community guidelines.'
      });
    }

    // Retrieve user details from authenticated user payload (appended by auth middleware)
    const user = req.user;

    const post = await Post.create({
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar || '',
      content: content.trim(),
      scope,
      district: user.district || 'Unknown',
      state: user.state || 'Unknown',
      country: user.country || 'India'
    });

    res.status(201).json({ success: true, post });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating post' });
  }
};

// @route   GET /api/community/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const { scope, district, state } = req.query;

    const query = {};

    if (scope) {
      query.scope = scope;
    }

    if (scope === 'District' && district) {
      query.district = district;
    } else if (scope === 'State' && state) {
      query.state = state;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 posts for performance

    res.status(200).json({ success: true, posts });

  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching posts' });
  }
};
