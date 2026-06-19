const CarbonService = require('../src/services/carbonService');

describe('CarbonService.calculateActivityCO2', () => {
  it('calculates transport emissions from distance', () => {
    const co2 = CarbonService.calculateActivityCO2({
      activityType: 'Car (Petrol)',
      category: 'transport',
      quantity: 10,
    });

    expect(co2).toBeGreaterThan(0);
  });

  it('maps home category to energy factors', () => {
    const co2 = CarbonService.calculateActivityCO2({
      activityType: 'AC usage',
      category: 'home',
      duration: 2,
    });

    expect(co2).toBeGreaterThan(0);
  });

  it('falls back to waste category for unknown categories', () => {
    const co2 = CarbonService.calculateActivityCO2({
      activityType: 'Plastic bottle',
      category: 'unknown-category',
      quantity: 1,
    });

    expect(co2).toBeGreaterThan(0);
  });

  it('returns zero for low-impact transport like walking', () => {
    const co2 = CarbonService.calculateActivityCO2({
      activityType: 'Walking',
      category: 'transport',
      quantity: 5,
    });

    expect(co2).toBe(0);
  });

  it('rounds results to two decimal places', () => {
    const co2 = CarbonService.calculateActivityCO2({
      activityType: 'Vegetarian meal',
      category: 'food',
      quantity: 1,
    });

    expect(co2.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});
