// Carbon emission factors (kg CO2 equivalent per unit)
export const EMISSION_FACTORS = {
  // Transport (per km)
  car_petrol:       0.21,
  car_diesel:       0.17,
  car_electric:     0.05,
  motorcycle:       0.11,
  bus:              0.089,
  train:            0.041,
  flight_short:     0.255,
  flight_long:      0.195,
  bicycle:          0,

  // Home energy (per hour)
  ac:               0.75,
  heater:           0.65,
  tv:               0.10,
  computer:         0.05,
  lights:           0.015,
  washing_machine:  0.70,
  dishwasher:       0.60,
  refrigerator:     0.012,

  // Food (per meal)
  beef_meal:        6.61,
  chicken_meal:     1.34,
  vegetarian_meal:  0.50,
  vegan_meal:       0.30,
  fish_meal:        1.96,

  // Water (per litre)
  water:            0.0003,

  // Waste & Shopping (per item/kg)
  plastic_bottle:   0.083,
  plastic_bag:      0.048,
  electronic_device:200,
  clothing:         10,

  // Electricity (per kWh)
  electricity:      0.43,
};

// Activity categories
export const CATEGORIES = {
  transport:  { label: 'Transport',   color: '#3B82F6', icon: 'car' },
  home:       { label: 'Home Energy', color: '#F59E0B', icon: 'home' },
  food:       { label: 'Food',        color: '#10B981', icon: 'utensils' },
  water:      { label: 'Water',       color: '#06B6D4', icon: 'droplets' },
  waste:      { label: 'Waste',       color: '#EF4444', icon: 'recycle' },
  shopping:   { label: 'Shopping',    color: '#8B5CF6', icon: 'shopping-bag' },
  other:      { label: 'Other',       color: '#6B7280', icon: 'package' },
};

// Pre-defined quick activities
export const QUICK_ACTIVITIES = [
  { id: 'q1', name: 'Car trip',         category: 'transport', unit: 'km',   factor: EMISSION_FACTORS.car_petrol },
  { id: 'q2', name: 'Bus ride',         category: 'transport', unit: 'km',   factor: EMISSION_FACTORS.bus },
  { id: 'q3', name: 'AC usage',         category: 'home',      unit: 'hours', factor: EMISSION_FACTORS.ac },
  { id: 'q4', name: 'Watched TV',       category: 'home',      unit: 'hours', factor: EMISSION_FACTORS.tv },
  { id: 'q5', name: 'Used computer',    category: 'home',      unit: 'hours', factor: EMISSION_FACTORS.computer },
  { id: 'q6', name: 'Plant-based meal', category: 'food',      unit: 'meals', factor: EMISSION_FACTORS.vegan_meal },
  { id: 'q7', name: 'Vegetarian meal',  category: 'food',      unit: 'meals', factor: EMISSION_FACTORS.vegetarian_meal },
  { id: 'q8', name: 'Plastic bottle',   category: 'waste',     unit: 'items', factor: EMISSION_FACTORS.plastic_bottle },
  { id: 'q9', name: 'Hot shower',       category: 'water',     unit: 'mins',  factor: 0.035 },
  { id: 'q10', name: 'Electricity used', category: 'home',     unit: 'kWh',   factor: EMISSION_FACTORS.electricity },
];

/**
 * Calculate carbon emission for a single activity
 * @param {string} factorKey - Key from EMISSION_FACTORS
 * @param {number} quantity  - Amount/duration
 * @returns {number} Carbon in kg CO2
 */
export function calcActivityCarbon(factorKey, quantity) {
  const factor = EMISSION_FACTORS[factorKey] ?? 0;
  return parseFloat((factor * quantity).toFixed(4));
}

/**
 * Canonical level thresholds — shared with backend getLevelFromXP.
 */
export const LEVELS = [
  { level: 1,  name: 'Seedling',       minXP: 0,     maxXP: 500,    emoji: '🌱' },
  { level: 2,  name: 'Sprout',         minXP: 500,   maxXP: 1500,   emoji: '🌿' },
  { level: 3,  name: 'Sapling',        minXP: 1500,  maxXP: 3000,   emoji: '🌳' },
  { level: 4,  name: 'Young Tree',     minXP: 3000,  maxXP: 5000,   emoji: '🌲' },
  { level: 5,  name: 'Green Hero',     minXP: 5000,  maxXP: 8000,   emoji: '⚡' },
  { level: 6,  name: 'Eco Warrior',    minXP: 8000,  maxXP: 12000,  emoji: '🛡️' },
  { level: 7,  name: 'Earth Guardian', minXP: 12000, maxXP: 18000,  emoji: '🌍' },
  { level: 8,  name: 'Planet Sage',    minXP: 18000, maxXP: 25000,  emoji: '🔮' },
  { level: 9,  name: 'Eco Legend',     minXP: 25000, maxXP: 35000,  emoji: '👑' },
  { level: 10, name: 'Climate Hero',   minXP: 35000, maxXP: 35000,  emoji: '🏆' },
];

/**
 * Daily carbon score (0-100, higher = better). Matches backend calculateDailyScore.
 */
export function calcDailyScore(totalKg) {
  return Math.max(0, Math.round(100 - totalKg));
}

/**
 * Get risk level based on daily kg CO2
 */
export function getRiskLevel(totalKg) {
  if (totalKg < 5)   return { level: 'Low',       color: '#00C896', bg: 'rgba(0,200,150,0.15)',   icon: 'leaf' };
  if (totalKg < 10)  return { level: 'Moderate',  color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  icon: 'alert-triangle' };
  if (totalKg < 20)  return { level: 'High',      color: '#F97316', bg: 'rgba(249,115,22,0.15)',  icon: 'flame' };
  return                    { level: 'Dangerous', color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   icon: 'skull' };
}

/**
 * Generate suggestions based on activity list
 */
export function generateSuggestions(activities) {
  const suggestions = [];
  const byCategory = {};

  activities.forEach(a => {
    if (!byCategory[a.category]) byCategory[a.category] = 0;
    byCategory[a.category] += a.carbonKg;
  });

  if ((byCategory.transport || 0) > 5) {
    suggestions.push({
      type: 'transport',
      icon: 'bike',
      text: 'Try cycling or walking for short trips to save up to 2.1 kg CO₂ per 10km.',
      saving: '2.1 kg/10km',
    });
  }
  if ((byCategory.home || 0) > 3) {
    suggestions.push({
      type: 'energy',
      icon: 'snowflake',
      text: 'Reduce AC usage by 1 hour/day to save ~0.75 kg CO₂ daily.',
      saving: '0.75 kg/day',
    });
  }
  if ((byCategory.food || 0) > 4) {
    suggestions.push({
      type: 'food',
      icon: 'leaf',
      text: 'Replace one beef meal with a vegetarian alternative to save 6.1 kg CO₂.',
      saving: '6.1 kg/meal',
    });
  }
  if ((byCategory.waste || 0) > 1) {
    suggestions.push({
      type: 'waste',
      icon: 'recycle',
      text: 'Use a reusable water bottle instead of plastic. Each bottle saves 83g CO₂.',
      saving: '83g/bottle',
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'great',
      icon: 'star',
      text: 'Great job! Your carbon footprint is below average today. Keep it up!',
      saving: null,
    });
  }
  return suggestions;
}

/**
 * XP earned for a daily score. Matches backend calculateXPEarned.
 */
export function calcXP(dailyScore) {
  if (dailyScore >= 100) return 150;
  if (dailyScore >= 80) return dailyScore + 20;
  if (dailyScore >= 50) return dailyScore;
  return Math.max(10, Math.floor(dailyScore / 2));
}

/**
 * Get level from total XP
 */
export function getLevel(totalXP) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

/**
 * Calculator - estimate annual carbon from inputs
 */
export function calculateFootprint({ electricityKWh, vehicleKm, waterLitres, foodType, plasticPerDay }) {
  const foodFactors = { veg: 1.5, mixed: 3.0, meat_heavy: 5.0 };
  const daily = {
    electricity: electricityKWh * EMISSION_FACTORS.electricity,
    vehicle:     vehicleKm * EMISSION_FACTORS.car_petrol,
    water:       waterLitres * EMISSION_FACTORS.water,
    food:        foodFactors[foodType] ?? 2.5,
    waste:       plasticPerDay * EMISSION_FACTORS.plastic_bottle,
  };

  const dailyTotal = Object.values(daily).reduce((a, b) => a + b, 0);
  const annualTotal = dailyTotal * 365;

  return {
    daily,
    dailyTotal: parseFloat(dailyTotal.toFixed(3)),
    annualTotal: parseFloat(annualTotal.toFixed(1)),
    riskLevel: getRiskLevel(dailyTotal),
  };
}
