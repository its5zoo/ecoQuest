const AIService = require('../services/aiService');

exports.chat = async (req, res) => {
  try {
    const { messages, context } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Invalid messages array' });
    }

    const reply = await AIService.chat(messages, context);

    res.status(200).json({
      success: true,
      data: reply
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Server error during chat' });
  }
};

exports.getTopicInfo = async (req, res) => {
  try {
    const { q, hint } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    const data = await AIService.explainEnvTopic(q);

    // If the frontend confirmed this is environmental but AI returned false, override
    if (hint === 'env' && data && !data.isEnvironmental) {
      // Force it to be treated as environmental — AI gave a wrong classification
      data.isEnvironmental = true;
      if (!data.title) data.title = q;
      if (!data.overview) data.overview = `${q} is an important environmental topic. Please refine your search for more details.`;
      if (!data.sections) data.sections = [];
      if (!data.facts) data.facts = [];
      if (!data.actionTips) data.actionTips = [];
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get topic info error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNews = async (req, res) => {
  try {
    const { q } = req.query;
    const news = await AIService.fetchLiveNews(q);
    res.status(200).json({
      success: true,
      news
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching news' });
  }
};
