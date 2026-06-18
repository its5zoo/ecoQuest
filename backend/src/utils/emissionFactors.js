// Carbon Emission Factors
// Values represent kg CO2e per unit

const EMISSION_FACTORS = {
  // Energy (per hour of usage)
  energy: {
    tv: 0.08,
    ac: 1.5,
    laptop: 0.05,
    washingMachine: 0.4,
    heater: 2.0,
    fridge: 0.1 // per hour average
  },
  
  // Transport (per km)
  transport: {
    car_petrol: 0.2,
    car_diesel: 0.25,
    car_electric: 0.05,
    bus: 0.08, // per passenger km
    train: 0.04, // per passenger km
    bike: 0,
    walk: 0,
    flight_short: 0.25, // per passenger km
    flight_long: 0.15 // per passenger km
  },
  
  // Food (per meal)
  food: {
    meat_heavy: 3.0,
    meat_light: 1.5,
    vegetarian: 0.7,
    vegan: 0.4
  },
  
  // Waste (per unit)
  waste: {
    plastic_bottle: 0.05,
    plastic_bag: 0.02,
    paper_recycling_bin: -0.1, // negative for offset
    compost_bin: -0.05
  },
  
  // Water (per minute of usage)
  water: {
    shower: 0.03, // hot shower requires energy
    bath: 0.5 // full bath
  }
};

module.exports = EMISSION_FACTORS;
