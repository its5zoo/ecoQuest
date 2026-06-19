const User = require('../models/User');
const { getRedisClient } = require('../config/redis');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute live MongoDB-based rank for a user within a scope.
 */
const computeMongoRank = async (user, scope) => {
  const filter = { xp: { $gt: user.xp } };
  if (scope === 'state')    filter.state    = user.state;
  if (scope === 'district') filter.district = user.district;
  const rank = await User.countDocuments(filter);
  return rank + 1; // 1-indexed
};

/**
 * Compute Redis-based rank for a user within a scope.
 */
const computeRedisRank = async (user, scope, redis) => {
  let key = 'leaderboard:national';
  if (scope === 'state')    key = `leaderboard:state:${user.state}`;
  if (scope === 'district') key = `leaderboard:district:${user.district}`;

  try {
    const rank = await redis.zRevRank(key, user._id.toString());
    return rank !== null ? rank + 1 : null;
  } catch {
    return null;
  }
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    Get global / state / district leaderboard
 *          Always injects the requesting user at their true rank position.
 * @route   GET /api/leaderboard?scope=global&limit=50&page=1
 *          GET /api/leaderboard?scope=state&region=Maharashtra&limit=50
 *          GET /api/leaderboard?scope=district&region=Pune&limit=50
 * @access  Private
 */
const getLeaderboard = async (req, res) => {
  try {
    const scope  = req.query.scope  || 'global';
    const region = req.query.region || '';
    const limit  = Math.min(Math.max(parseInt(req.query.limit)  || 50, 1), 200);
    const page   = Math.max(parseInt(req.query.page)   || 1, 1);
    const skip   = (page - 1) * limit;

    // Build MongoDB filter
    const filter = {};
    if (scope === 'state'    && region) filter.state    = region;
    if (scope === 'district' && region) filter.district = region;

    // Fetch sorted users from MongoDB + total count
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ xp: -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .select('name avatar level xp streak carbonSaved totalCarbonKg district state country badges createdAt')
        .populate('badges', 'name icon')
        .lean(),
      User.countDocuments(filter),
    ]);

    // Attach rank numbers
    const leaderboard = users.map((u, idx) => ({
      rank:          skip + idx + 1,
      _id:           u._id,
      name:          u.name,
      avatar:        u.avatar,
      level:         u.level,
      xp:            u.xp,
      streak:        u.streak,
      carbonSaved:   u.carbonSaved,
      totalCarbonKg: u.totalCarbonKg,
      district:      u.district,
      state:         u.state,
      country:       u.country,
      badges:        u.badges || [],
      memberSince:   u.createdAt,
    }));

    // ── Always inject the requesting user ──────────────────────────────────
    const requestingUserId = req.user._id.toString();
    const alreadyInList = leaderboard.some(e => String(e._id) === requestingUserId);

    let myEntry = null;
    if (!alreadyInList) {
      // Fetch requesting user's full data
      const me = await User.findById(req.user._id)
        .select('name avatar level xp streak carbonSaved totalCarbonKg district state country badges createdAt')
        .populate('badges', 'name icon')
        .lean();

      if (me) {
        // Compute their true rank in this scope
        const myRankFilter = { xp: { $gt: me.xp } };
        if (scope === 'state'    && region) myRankFilter.state    = region;
        if (scope === 'district' && region) myRankFilter.district = region;

        const myTrueRank = await User.countDocuments(myRankFilter) + 1;

        myEntry = {
          rank:          myTrueRank,
          _id:           me._id,
          name:          me.name,
          avatar:        me.avatar,
          level:         me.level,
          xp:            me.xp,
          streak:        me.streak,
          carbonSaved:   me.carbonSaved,
          totalCarbonKg: me.totalCarbonKg,
          district:      me.district,
          state:         me.state,
          country:       me.country,
          badges:        me.badges || [],
          memberSince:   me.createdAt,
          isMe:          true,
        };
      }
    } else {
      // Mark the user in the list as "me"
      const meInList = leaderboard.find(e => String(e._id) === requestingUserId);
      if (meInList) meInList.isMe = true;
    }

    return res.status(200).json({
      scope,
      region: region || 'All',
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      leaderboard,
      me: myEntry, // null if already in list
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get a specific user's rank, score and position
 * @route   GET /api/leaderboard/my-rank
 * @access  Private
 */
const getMyRank = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('badges', 'name icon')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const redis = getRedisClient();

    let globalRank, stateRank, districtRank;

    if (redis) {
      [globalRank, stateRank, districtRank] = await Promise.all([
        computeRedisRank(user, 'global',   redis),
        computeRedisRank(user, 'state',    redis),
        computeRedisRank(user, 'district', redis),
      ]);
    }

    // Always fall back to MongoDB
    if (!globalRank)   globalRank   = await computeMongoRank(user, 'global');
    if (!stateRank)    stateRank    = await computeMongoRank(user, 'state');
    if (!districtRank) districtRank = await computeMongoRank(user, 'district');

    // Rank values are returned in the response but not persisted back on a read request.
    // Persistence is handled by RankingService.updateUserRanking when activities are logged.

    const [totalGlobal, totalState, totalDistrict] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ state: user.state }),
      User.countDocuments({ district: user.district }),
    ]);

    return res.status(200).json({
      _id:          user._id,
      name:         user.name,
      avatar:       user.avatar,
      level:        user.level,
      xp:           user.xp,
      streak:       user.streak,
      carbonSaved:  user.carbonSaved,
      totalCarbonKg: user.totalCarbonKg,
      badges:       user.badges,
      ranks: {
        global:   { rank: globalRank,   total: totalGlobal,   percentile: Math.round((1 - globalRank / totalGlobal) * 100) },
        state:    { rank: stateRank,    total: totalState,    percentile: Math.round((1 - stateRank / totalState) * 100),    region: user.state },
        district: { rank: districtRank, total: totalDistrict, percentile: Math.round((1 - districtRank / totalDistrict) * 100), region: user.district },
      },
    });

  } catch (error) {
    console.error('My-rank error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get leaderboard entry for a specific user by ID
 * @route   GET /api/leaderboard/user/:userId
 * @access  Private
 */
const getUserRank = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('badges', 'name icon')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const [globalRank, stateRank, districtRank, totalGlobal, totalState, totalDistrict] =
      await Promise.all([
        computeMongoRank(user, 'global'),
        computeMongoRank(user, 'state'),
        computeMongoRank(user, 'district'),
        User.countDocuments({}),
        User.countDocuments({ state: user.state }),
        User.countDocuments({ district: user.district }),
      ]);

    return res.status(200).json({
      _id:          user._id,
      name:         user.name,
      avatar:       user.avatar,
      level:        user.level,
      xp:           user.xp,
      streak:       user.streak,
      carbonSaved:  user.carbonSaved,
      badges:       user.badges,
      ranks: {
        global:   { rank: globalRank,   total: totalGlobal },
        state:    { rank: stateRank,    total: totalState,    region: user.state },
        district: { rank: districtRank, total: totalDistrict, region: user.district },
      },
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get top-3 users for podium view
 * @route   GET /api/leaderboard/top3?scope=global&region=Maharashtra
 * @access  Private
 */
const getTop3 = async (req, res) => {
  try {
    const scope  = req.query.scope  || 'global';
    const region = req.query.region || '';
    const filter = {};
    if (scope === 'state'    && region) filter.state    = region;
    if (scope === 'district' && region) filter.district = region;

    const users = await User.find(filter)
      .sort({ xp: -1 })
      .limit(3)
      .select('name avatar level xp streak carbonSaved district state badges')
      .populate('badges', 'name icon')
      .lean();

    const podium = users.map((u, idx) => ({
      position: idx + 1,
      _id:    u._id,
      name:   u.name,
      avatar: u.avatar,
      level:  u.level,
      xp:     u.xp,
      streak: u.streak,
      carbonSaved: u.carbonSaved,
      badges: u.badges || [],
    }));

    return res.status(200).json({ scope, region: region || 'All', podium });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all unique states and districts
 * @route   GET /api/leaderboard/regions
 * @access  Private
 */
const getRegions = async (req, res) => {
  try {
    const states    = await User.distinct('state');
    const districts = await User.distinct('district');
    return res.status(200).json({ states: states.sort(), districts: districts.sort() });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeaderboard,
  getMyRank,
  getUserRank,
  getTop3,
  getRegions,
};
