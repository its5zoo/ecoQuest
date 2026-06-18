const rateLimits = new Map();
const MAX_KEYS = 10000;

/**
 * Spam protection middleware.
 */
const spamLimiter = (options = {}) => {
  const maxRequests = options.maxRequests || 5;
  const windowMs = options.windowMs || 60000;
  const actionName = options.actionName || 'messages';

  return (req, res, next) => {
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const key = `${actionName}:${identifier}`;

    const now = Date.now();
    let userRequests = rateLimits.get(key) || [];
    userRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

    if (userRequests.length >= maxRequests) {
      const oldestRequest = userRequests[0];
      const secondsLeft = Math.ceil((windowMs - (now - oldestRequest)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Please wait ${secondsLeft} seconds.`,
      });
    }

    userRequests.push(now);
    rateLimits.set(key, userRequests);

    if (rateLimits.size > MAX_KEYS) {
      const oldestKey = rateLimits.keys().next().value;
      rateLimits.delete(oldestKey);
    }

    next();
  };
};

module.exports = spamLimiter;
