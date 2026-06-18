const { getRedisClient } = require('../config/redis');
const User = require('../models/User');

class RankingService {
  /**
   * Update the user's score in the Redis leaderboard AND persist rank to MongoDB.
   * @param {Object} user - User document
   */
  static async updateUserRanking(user) {
    const redis = getRedisClient();
    const userId = user._id.toString();
    const score = user.xp;

    // 1. Update Redis leaderboards (if available)
    if (redis) {
      try {
        await Promise.all([
          redis.zAdd('leaderboard:national',                    { score, value: userId }),
          user.state    && redis.zAdd(`leaderboard:state:${user.state}`,       { score, value: userId }),
          user.district && redis.zAdd(`leaderboard:district:${user.district}`, { score, value: userId }),
        ].filter(Boolean));
      } catch (err) {
        console.error('Redis ranking update failed (non-fatal):', err.message);
      }
    }

    // 2. Compute and persist rank to MongoDB (always)
    try {
      const [globalRank, stateRank, districtRank] = await Promise.all([
        User.countDocuments({ xp: { $gt: score } }).then(c => c + 1),
        User.countDocuments({ xp: { $gt: score }, state: user.state }).then(c => c + 1),
        User.countDocuments({ xp: { $gt: score }, district: user.district }).then(c => c + 1),
      ]);

      await User.findByIdAndUpdate(user._id, {
        $set: { globalRank, stateRank, districtRank },
      });
    } catch (err) {
      console.error('MongoDB rank persistence failed (non-fatal):', err.message);
    }
  }

  /**
   * Get Top Users for a specific scope — MongoDB-powered with full details.
   * @param {string} scope    - 'national' | 'state' | 'district'
   * @param {string} region   - State or district name when applicable
   * @param {number} limit    - Max number of results
   */
  static async getTopUsers(scope, region = '', limit = 100) {
    try {
      const filter = {};
      if (scope === 'state'    && region) filter.state    = region;
      if (scope === 'district' && region) filter.district = region;

      const users = await User.find(filter)
        .sort({ xp: -1 })
        .limit(limit)
        .select('name avatar level xp streak carbonSaved district state country')
        .lean();

      return users.map((u, idx) => ({ rank: idx + 1, ...u }));
    } catch (err) {
      console.error('Error fetching top users:', err);
      return [];
    }
  }
}

module.exports = RankingService;
