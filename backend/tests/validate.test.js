const { validateSignup, validateLogin, validateActivity } = require('../src/utils/validate');
const { calculateDailyScore, calculateXPEarned, getLevelFromXP } = require('../src/utils/calculateXP');

describe('validateSignup', () => {
  it('rejects short passwords', () => {
    const result = validateSignup({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      district: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid signup payload', () => {
    const result = validateSignup({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      district: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateLogin', () => {
  it('requires email and password', () => {
    expect(validateLogin({}).valid).toBe(false);
    expect(validateLogin({ email: 'a@b.com', password: 'x' }).valid).toBe(true);
  });
});

describe('validateActivity', () => {
  it('rejects out-of-range quantity', () => {
    const result = validateActivity({
      activityType: 'walk',
      category: 'transport',
      quantity: 99999,
    });
    expect(result.valid).toBe(false);
  });
});

describe('calculateXP', () => {
  it('returns perfect score XP bonus', () => {
    expect(calculateDailyScore(0)).toBe(100);
    expect(calculateXPEarned(100)).toBe(150);
  });

  it('maps XP to levels', () => {
    expect(getLevelFromXP(0)).toBe(1);
    expect(getLevelFromXP(500)).toBe(2);
    expect(getLevelFromXP(35000)).toBe(10);
  });
});
