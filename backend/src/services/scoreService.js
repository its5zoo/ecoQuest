const { calculateDailyScore, calculateXPEarned, getLevelFromXP } = require('../utils/calculateXP');
const User = require('../models/User');
const { getModelForUser } = require('../utils/dbHelper');

class ScoreService {
  /**
   * Update a user's daily score and total XP after logging an activity
   * @param {string} userId 
   * @param {number} co2Added - CO2 added in kg
   */
  static async updateScore(userId, co2Added) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user-specific ScoreHistory model
    const UserScoreHistory = getModelForUser(userId, 'ScoreHistory');

    // 1. Find or create today's ScoreHistory
    let history = await UserScoreHistory.findOne({ user: userId, date: today });
    if (!history) {
      history = new UserScoreHistory({ user: userId, date: today });
    }

    // 2. Update daily carbon
    history.dailyCarbon += co2Added;

    // 3. Recalculate daily score
    const oldScore = history.dailyScore;
    const newScore = calculateDailyScore(history.dailyCarbon);
    history.dailyScore = newScore;

    // 4. Calculate XP difference
    // If this is the first activity of the day, we calculate XP based on the new score.
    // If it's a subsequent activity, the score drops, so XP earned might change. 
    // For simplicity in this engine: we'll recalculate the total XP for the day and adjust the user's total.
    const oldXPEarned = history.xpEarned;
    const newXPEarned = calculateXPEarned(newScore);
    history.xpEarned = newXPEarned;

    await history.save();

    // 5. Update User Profile
    const xpDifference = newXPEarned - oldXPEarned;
    
    const user = await User.findById(userId);
    if (user) {
      user.xp += xpDifference;
      user.level = getLevelFromXP(user.xp);
      // user.carbonSaved could be calculated relative to a benchmark
      await user.save();
    }

    return {
      newScore,
      xpEarnedToday: newXPEarned,
      newTotalXp: user ? user.xp : 0,
      newLevel: user ? user.level : 1
    };
  }
}

module.exports = ScoreService;
