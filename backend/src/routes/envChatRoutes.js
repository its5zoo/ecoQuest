const express = require('express');
const router  = express.Router();
const { getHistory, sendMessage, clearHistory } = require('../controllers/envChatController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const spamLimiter = require('../middleware/spamLimiter');

router.get('/', optionalProtect, getHistory);
router.post('/', optionalProtect, spamLimiter({ maxRequests: 10, windowMs: 60000, actionName: 'messages' }), sendMessage);
router.delete('/', optionalProtect, clearHistory);

module.exports = router;
