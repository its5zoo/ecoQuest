const mongoose = require('mongoose');

// Cache model compilations to prevent OverwriteModelError
const modelCache = new Map();

/**
 * Gets a Mongoose model bound to a user-specific database connection.
 * Keeps User and Post models shared in the primary database.
 * @param {string} userId - The unique ID of the user.
 * @param {string} modelName - The name of the model (e.g. 'Activity', 'ScoreHistory', 'EnvChat').
 * @returns {mongoose.Model}
 */
const getModelForUser = (userId, modelName) => {
  if (!userId) {
    return mongoose.model(modelName);
  }

  const dbName = `usr_${userId}`;
  const cacheKey = `${dbName}:${modelName}`;

  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey);
  }

  // Switch connection dynamically to the user's specific database
  const userConn = mongoose.connection.useDb(dbName, { useCache: true });
  
  // Get schema from the default compiled model
  const defaultModel = mongoose.model(modelName);
  const schema = defaultModel.schema;

  // Compile the model on the user's connection
  const userModel = userConn.model(modelName, schema);
  modelCache.set(cacheKey, userModel);

  return userModel;
};

module.exports = { getModelForUser };
