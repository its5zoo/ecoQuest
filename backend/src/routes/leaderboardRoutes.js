const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getMyRank,
  getUserRank,
  getTop3,
  getRegions,
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

// All leaderboard routes require authentication
router.use(protect);

// GET /api/leaderboard?scope=global|state|district&region=...&limit=50&page=1
router.get('/', getLeaderboard);

// GET /api/leaderboard/my-rank  — returns the logged-in user's rank & stats
router.get('/my-rank', getMyRank);

// GET /api/leaderboard/top3?scope=global&region=...  — podium view
router.get('/top3', getTop3);

// GET /api/leaderboard/regions  — list all states & districts
router.get('/regions', getRegions);

// GET /api/leaderboard/user/:userId  — public profile rank
router.get('/user/:userId', getUserRank);

module.exports = router;
