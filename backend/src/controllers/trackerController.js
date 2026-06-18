const { getModelForUser } = require('../utils/dbHelper');
const User = require('../models/User');
const CarbonService  = require('../services/carbonService');
const ScoreService   = require('../services/scoreService');
const RankingService = require('../services/rankingService');
const AIService      = require('../services/aiService');
const { validateActivity } = require('../utils/validate');

const addActivity = async (req, res) => {
  const validation = validateActivity(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors.join('. ') });
  }

  const { activityType, category, duration, quantity } = req.body;

  try {
    const co2Generated = CarbonService.calculateActivityCO2({ activityType, category, duration, quantity });
    const UserActivity = getModelForUser(req.user._id, 'Activity');

    const activity = await UserActivity.create({
      user: req.user._id,
      activityType,
      category,
      duration,
      quantity,
      co2Generated,
    });

    const scoreUpdate = await ScoreService.updateScore(req.user._id, co2Generated);

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalCarbonKg: co2Generated },
    });

    const updatedUser = await User.findById(req.user._id);
    await RankingService.updateUserRanking(updatedUser);

    // Fire-and-forget AI insight — do not block response
    UserActivity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(5)
      .then((recentActivities) => AIService.generateInsight(recentActivities))
      .catch((err) => console.error('Async AI insight error:', err));

    return res.status(201).json({
      activity,
      scoreUpdate,
      aiInsight: null,
    });
  } catch (error) {
    console.error('addActivity error:', error);
    return res.status(400).json({ message: error.message });
  }
};

const getActivities = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip  = (page - 1) * limit;

    const UserActivity = getModelForUser(req.user._id, 'Activity');
    const [activities, total] = await Promise.all([
      UserActivity.find({ user: req.user._id }).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      UserActivity.countDocuments({ user: req.user._id }),
    ]);

    return res.status(200).json({
      activities,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { addActivity, getActivities };
