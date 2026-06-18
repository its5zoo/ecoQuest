const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const spamLimiter = require('../middleware/spamLimiter');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);
router.use(aiLimiter);

router.post('/chat', spamLimiter({ maxRequests: 10, windowMs: 60000, actionName: 'messages' }), aiController.chat);
router.get('/news', aiController.getNews);
router.get('/topic', aiController.getTopicInfo);

module.exports = router;
