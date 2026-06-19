const EMISSION_FACTORS = require('../src/utils/emissionFactors');

describe('emissionFactors', () => {
  it('exports expected category groups', () => {
    expect(EMISSION_FACTORS).toHaveProperty('energy');
    expect(EMISSION_FACTORS).toHaveProperty('transport');
    expect(EMISSION_FACTORS).toHaveProperty('food');
    expect(EMISSION_FACTORS).toHaveProperty('waste');
    expect(EMISSION_FACTORS).toHaveProperty('water');
  });

  it('includes zero-emission transport modes', () => {
    expect(EMISSION_FACTORS.transport.bike).toBe(0);
    expect(EMISSION_FACTORS.transport.walk).toBe(0);
  });

  it('includes negative offsets for recycling actions', () => {
    expect(EMISSION_FACTORS.waste.paper_recycling_bin).toBeLessThan(0);
    expect(EMISSION_FACTORS.waste.compost_bin).toBeLessThan(0);
  });
});
