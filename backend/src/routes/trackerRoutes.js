const express = require('express');
const router = express.Router();
const { addActivity, getActivities } = require('../controllers/trackerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addActivity);
router.get('/all', protect, getActivities);

module.exports = router;
