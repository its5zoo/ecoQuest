const {
  calculateDailyScore,
  calculateXPEarned,
  getLevelFromXP,
} = require('../src/utils/calculateXP');

describe('calculateDailyScore', () => {
  it('returns 100 for zero carbon', () => {
    expect(calculateDailyScore(0)).toBe(100);
  });

  it('subtracts carbon from max score', () => {
    expect(calculateDailyScore(25)).toBe(75);
  });

  it('floors at zero when carbon exceeds 100kg', () => {
    expect(calculateDailyScore(150)).toBe(0);
  });

  it('rounds fractional carbon values', () => {
    expect(calculateDailyScore(10.4)).toBe(90);
  });
});

describe('calculateXPEarned', () => {
  it('awards 150 XP for a perfect score', () => {
    expect(calculateXPEarned(100)).toBe(150);
  });

  it('adds bonus for scores at or above 80', () => {
    expect(calculateXPEarned(80)).toBe(100);
    expect(calculateXPEarned(90)).toBe(110);
  });

  it('returns score as XP between 50 and 79', () => {
    expect(calculateXPEarned(50)).toBe(50);
    expect(calculateXPEarned(65)).toBe(65);
  });

  it('returns minimum 10 XP for low scores', () => {
    expect(calculateXPEarned(0)).toBe(10);
    expect(calculateXPEarned(19)).toBe(10);
  });

  it('halves low scores above the minimum threshold', () => {
    expect(calculateXPEarned(40)).toBe(20);
  });
});

describe('getLevelFromXP', () => {
  it('maps XP to levels 1 through 10', () => {
    expect(getLevelFromXP(0)).toBe(1);
    expect(getLevelFromXP(499)).toBe(1);
    expect(getLevelFromXP(500)).toBe(2);
    expect(getLevelFromXP(1499)).toBe(2);
    expect(getLevelFromXP(1500)).toBe(3);
    expect(getLevelFromXP(2999)).toBe(3);
    expect(getLevelFromXP(3000)).toBe(4);
    expect(getLevelFromXP(4999)).toBe(4);
    expect(getLevelFromXP(5000)).toBe(5);
    expect(getLevelFromXP(7999)).toBe(5);
    expect(getLevelFromXP(8000)).toBe(6);
    expect(getLevelFromXP(11999)).toBe(6);
    expect(getLevelFromXP(12000)).toBe(7);
    expect(getLevelFromXP(17999)).toBe(7);
    expect(getLevelFromXP(18000)).toBe(8);
    expect(getLevelFromXP(24999)).toBe(8);
    expect(getLevelFromXP(25000)).toBe(9);
    expect(getLevelFromXP(34999)).toBe(9);
    expect(getLevelFromXP(35000)).toBe(10);
    expect(getLevelFromXP(999999)).toBe(10);
  });
});
