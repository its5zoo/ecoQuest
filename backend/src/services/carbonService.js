const EMISSION_FACTORS = require('../utils/emissionFactors');

class CarbonService {
  /**
   * Deterministic calculation of CO2 based on activity input.
   * Map frontend categories and names to backend factors robustly.
   * @param {Object} activityData 
   * @returns {number} CO2 generated in kg
   */
  static calculateActivityCO2(activityData) {
    const { activityType, category, duration, quantity } = activityData;
    
    // 1. Map categories from frontend to backend
    let mappedCategory = (category || '').toLowerCase().trim();
    if (mappedCategory === 'home') mappedCategory = 'energy';
    if (mappedCategory === 'shopping' || mappedCategory === 'other') mappedCategory = 'waste';
    
    if (!EMISSION_FACTORS[mappedCategory]) {
      mappedCategory = 'waste'; // default fallback category
    }

    const categoryFactors = EMISSION_FACTORS[mappedCategory];
    const typeLower = (activityType || '').toLowerCase().trim();
    
    // 2. Resolve emission factor with partial matching and smart fallbacks
    let factor = categoryFactors[typeLower];

    if (factor === undefined) {
      const keys = Object.keys(categoryFactors);
      const matchedKey = keys.find(k => typeLower.includes(k) || k.includes(typeLower));
      if (matchedKey !== undefined) {
        factor = categoryFactors[matchedKey];
      } else {
        // Semantic fallbacks based on keywords
        if (mappedCategory === 'energy') {
          if (typeLower.includes('ac') || typeLower.includes('air con')) factor = categoryFactors.ac;
          else if (typeLower.includes('tv') || typeLower.includes('television')) factor = categoryFactors.tv;
          else if (typeLower.includes('computer') || typeLower.includes('laptop')) factor = categoryFactors.laptop;
          else factor = 0.1; // average energy device
        } else if (mappedCategory === 'transport') {
          if (typeLower.includes('car')) factor = categoryFactors.car_petrol;
          else if (typeLower.includes('bus')) factor = categoryFactors.bus;
          else if (typeLower.includes('train')) factor = categoryFactors.train;
          else if (typeLower.includes('flight') || typeLower.includes('plane')) factor = categoryFactors.flight_short;
          else factor = 0; // walking / biking
        } else if (mappedCategory === 'food') {
          if (typeLower.includes('beef') || typeLower.includes('pork') || typeLower.includes('meat')) factor = categoryFactors.meat_heavy;
          else if (typeLower.includes('chicken') || typeLower.includes('fish')) factor = categoryFactors.meat_light;
          else if (typeLower.includes('veg') || typeLower.includes('vegetarian')) factor = categoryFactors.vegetarian;
          else if (typeLower.includes('vegan')) factor = categoryFactors.vegan;
          else factor = 0.7; // default average meal
        } else if (mappedCategory === 'waste') {
          if (typeLower.includes('bottle')) factor = categoryFactors.plastic_bottle;
          else if (typeLower.includes('bag')) factor = categoryFactors.plastic_bag;
          else factor = 0.05; // default waste item
        } else if (mappedCategory === 'water') {
          if (typeLower.includes('shower')) factor = categoryFactors.shower;
          else if (typeLower.includes('bath')) factor = categoryFactors.bath;
          else factor = 0.03;
        } else {
          factor = 0.1;
        }
      }
    }

    // 3. Compute CO2 based on category unit type
    let co2 = 0;
    switch (mappedCategory) {
      case 'energy':
        co2 = factor * (duration || 1);
        break;
      case 'transport':
        co2 = factor * (quantity || 1);
        break;
      case 'food':
        co2 = factor * (quantity || 1);
        break;
      case 'waste':
        co2 = factor * (quantity || 1);
        break;
      case 'water':
        co2 = factor * (duration || 1);
        break;
      default:
        co2 = factor * (quantity || 1);
    }

    return parseFloat(co2.toFixed(2));
  }
}

module.exports = CarbonService;
