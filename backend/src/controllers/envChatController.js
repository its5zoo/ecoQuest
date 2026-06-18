const mongoose = require('mongoose');
const EnvChat = require('../models/EnvChat');
const AIService = require('../services/aiService');
const { getModelForUser } = require('../utils/dbHelper');

// Helper to get cutoff date (2 days ago)
const getCutoffDate = () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

/**
 * GET /api/env-chat
 * Returns the current user's full chat history (most recent 100 messages)
 * Auto-deletes messages older than 2 days from the document.
 * If no real userId (guest/mock), returns empty history.
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.json({ success: true, messages: [] });

    const UserEnvChat = getModelForUser(userId, 'EnvChat');
    let chat = await UserEnvChat.findOne({ userId });
    
    if (chat && chat.messages.length > 0) {
      const cutoff = getCutoffDate();
      const initialLength = chat.messages.length;
      chat.messages = chat.messages.filter(m => new Date(m.createdAt) >= cutoff);
      
      // Save changes if any old messages were filtered out
      if (chat.messages.length !== initialLength) {
        await chat.save();
      }
    }

    const messages = chat ? chat.messages.slice(-100) : [];
    res.json({ success: true, messages });
  } catch (err) {
    console.error('EnvChat getHistory error:', err);
    res.status(500).json({ success: false, message: 'Could not load chat history' });
  }
};

/**
 * POST /api/env-chat
 * Body: { question: string }
 * If real user → saves to MongoDB; if guest → AI-only (no DB)
 * Auto-filters history for messages older than 2 days before replying.
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    let priorHistory = [];

    if (userId) {
      // Real logged-in user — load history from MongoDB user-specific database
      const UserEnvChat = getModelForUser(userId, 'EnvChat');
      let chat = await UserEnvChat.findOne({ userId });
      if (!chat) chat = new UserEnvChat({ userId, messages: [] });

      // Clean up old messages from history on the fly
      const cutoff = getCutoffDate();
      chat.messages = chat.messages.filter(m => new Date(m.createdAt) >= cutoff);

      priorHistory = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

      // Generate AI response
      const answer = await AIService.envChatAnswer(question.trim(), priorHistory);

      const userMsg = { role: 'user',      content: question.trim(), createdAt: new Date() };
      const aiMsg   = { role: 'assistant', content: answer,           createdAt: new Date() };

      chat.messages.push(userMsg, aiMsg);
      await chat.save();

      return res.json({ success: true, userMessage: userMsg, aiMessage: aiMsg });
    } else {
      // Guest / mock token — AI response without DB
      const answer = await AIService.envChatAnswer(question.trim(), []);
      const now = new Date();
      const userMsg = { role: 'user',      content: question.trim(), createdAt: now, _id: `g-${Date.now()}` };
      const aiMsg   = { role: 'assistant', content: answer,           createdAt: now, _id: `g-${Date.now() + 1}` };

      return res.json({ success: true, userMessage: userMsg, aiMessage: aiMsg });
    }
  } catch (err) {
    console.error('EnvChat sendMessage error:', err);
    res.status(500).json({ success: false, message: 'Failed to process message' });
  }
};

/**
 * DELETE /api/env-chat
 * Clears the user's full chat history (only for real users)
 */
exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (userId) {
      const UserEnvChat = getModelForUser(userId, 'EnvChat');
      await UserEnvChat.findOneAndUpdate({ userId }, { messages: [] }, { upsert: true });
    }
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    console.error('EnvChat clearHistory error:', err);
    res.status(500).json({ success: false, message: 'Could not clear history' });
  }
};

// ─── Background Cleanup Timer ────────────────────────────────
// Periodically cleans up messages older than 2 days across all user-specific databases.
// Runs every 12 hours.
setInterval(async () => {
  try {
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    const cutoff = getCutoffDate();

    for (const dbInfo of databases) {
      if (dbInfo.name.startsWith('usr_')) {
        const userConn = mongoose.connection.useDb(dbInfo.name, { useCache: true });
        const UserEnvChat = userConn.model('EnvChat', EnvChat.schema);
        const result = await UserEnvChat.updateMany(
          {},
          { $pull: { messages: { createdAt: { $lt: cutoff } } } }
        );
        if (result.modifiedCount > 0) {
          console.log(`🧹 Scheduled Chat Cleanup [${dbInfo.name}]: Cleared expired messages. Modified: ${result.modifiedCount}`);
        }
      }
    }
  } catch (err) {
    console.error('Scheduled Chat Cleanup Error:', err);
  }
}, 12 * 60 * 60 * 1000);
