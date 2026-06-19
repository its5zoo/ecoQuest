const mongoose = require('mongoose');

/**
 * Gets a Mongoose model. All user records reside in unified collections,
 * partitioned by user ID field.
 * @param {string} userId - The unique ID of the user (kept for interface compatibility).
 * @param {string} modelName - The name of the model (e.g. 'Activity', 'ScoreHistory', 'EnvChat').
 * @returns {mongoose.Model}
 */
const getModelForUser = (userId, modelName) => {
  return mongoose.model(modelName);
};

module.exports = { getModelForUser };

