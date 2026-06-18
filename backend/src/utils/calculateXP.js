/**
 * Convert Carbon saved/emitted to XP and calculate level
 * Formula based on user requirements: Less CO2 = More XP
 */

// Base max score for a perfect zero-carbon day
const MAX_DAILY_SCORE = 100;

/**
 * Calculate the daily score based on carbon emitted
 * @param {number} dailyCarbon - Total carbon emitted today in kg
 * @returns {number} Score from 0 to 100
 */
const calculateDailyScore = (dailyCarbon) => {
  // Simple formula: 100 - carbon.
  // If carbon > 100kg, score is 0.
  let score = MAX_DAILY_SCORE - dailyCarbon;
  return Math.max(0, Math.round(score));
};

/**
 * Calculate XP earned based on the daily score
 * @param {number} score - Daily score (0-100)
 * @returns {number} XP earned
 */
const calculateXPEarned = (score) => {
  // Base XP is the score itself.
  // If perfect score (100), give bonus.
  if (score >= 100) return 150; 
  if (score >= 80) return score + 20;
  if (score >= 50) return score;
  return Math.max(10, Math.floor(score / 2)); // Minimum 10 XP just for tracking
};

/**
 * Get Level based on total XP
 * Example thresholds:
 * Level 1: 0 - 499
 * Level 2: 500 - 1499
 * Level 3: 1500 - 2999
 * ...
 * @param {number} totalXp 
 * @returns {number} Level (1-based)
 */
const getLevelFromXP = (totalXp) => {
  if (totalXp < 500) return 1;
  if (totalXp < 1500) return 2;
  if (totalXp < 3000) return 3;
  if (totalXp < 5000) return 4;
  if (totalXp < 8000) return 5;
  if (totalXp < 12000) return 6;
  if (totalXp < 18000) return 7;
  if (totalXp < 25000) return 8;
  if (totalXp < 35000) return 9;
  return 10; // Max level for now
};

module.exports = {
  calculateDailyScore,
  calculateXPEarned,
  getLevelFromXP
};
