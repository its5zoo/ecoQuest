import { describe, it, expect } from 'vitest';
import {
  calcActivityCarbon,
  calcDailyScore,
  calcXP,
  getLevel,
  getRiskLevel,
  generateSuggestions,
  calculateFootprint,
  QUICK_ACTIVITIES,
  CATEGORIES,
} from './carbonLogic';
import { parseSvgAvatarId } from './helpers';

describe('carbonLogic exports', () => {
  it('exposes quick activities and categories', () => {
    expect(QUICK_ACTIVITIES.length).toBeGreaterThan(0);
    expect(CATEGORIES.transport.label).toBe('Transport');
  });
});

describe('calcActivityCarbon', () => {
  it('calculates transport emissions', () => {
    expect(calcActivityCarbon('car_petrol', 10)).toBe(2.1);
  });

  it('returns zero for unknown factors', () => {
    expect(calcActivityCarbon('unknown_factor', 10)).toBe(0);
  });
});

describe('calcDailyScore', () => {
  it('computes daily score from carbon footprint', () => {
    expect(calcDailyScore(0)).toBe(0);
    expect(calcDailyScore(15)).toBe(50);
    expect(calcDailyScore(30)).toBe(100);
    expect(calcDailyScore(60)).toBe(100);
  });
});

describe('getRiskLevel', () => {
  it('returns the correct risk band for each threshold', () => {
    expect(getRiskLevel(2).level).toBe('Low');
    expect(getRiskLevel(4.9).level).toBe('Low');
    expect(getRiskLevel(5).level).toBe('Moderate');
    expect(getRiskLevel(7).level).toBe('Moderate');
    expect(getRiskLevel(10).level).toBe('High');
    expect(getRiskLevel(15).level).toBe('High');
    expect(getRiskLevel(20).level).toBe('Dangerous');
    expect(getRiskLevel(25).level).toBe('Dangerous');
  });
});

describe('generateSuggestions', () => {
  it('returns category-specific suggestions when thresholds are exceeded', () => {
    const suggestions = generateSuggestions([
      { category: 'transport', carbonKg: 6 },
      { category: 'home', carbonKg: 4 },
      { category: 'food', carbonKg: 5 },
      { category: 'waste', carbonKg: 2 },
    ]);

    expect(suggestions.map((s) => s.type)).toEqual(
      expect.arrayContaining(['transport', 'energy', 'food', 'waste'])
    );
  });

  it('aggregates repeated categories before applying thresholds', () => {
    const suggestions = generateSuggestions([
      { category: 'transport', carbonKg: 2.5 },
      { category: 'transport', carbonKg: 2.6 },
    ]);

    expect(suggestions.map((s) => s.type)).toContain('transport');
  });

  it('does not emit transport suggestions when transport data is absent', () => {
    const suggestions = generateSuggestions([
      { category: 'waste', carbonKg: 2 },
    ]);

    expect(suggestions.some((s) => s.type === 'transport')).toBe(false);
    expect(suggestions.some((s) => s.type === 'waste')).toBe(true);
  });

  it('returns a praise suggestion when footprint is low', () => {
    const suggestions = generateSuggestions([
      { category: 'transport', carbonKg: 1 },
    ]);
    expect(suggestions[0].type).toBe('great');
  });
});

describe('calcXP', () => {
  it('awards more XP for lower daily scores', () => {
    expect(calcXP(0)).toBe(200);
    expect(calcXP(50)).toBe(100);
    expect(calcXP(100)).toBe(0);
  });
});

describe('getLevel', () => {
  it('maps XP to levels', () => {
    expect(getLevel(0).level).toBe(1);
    expect(getLevel(500).level).toBeGreaterThanOrEqual(2);
    expect(getLevel(15000).name).toBe('Climate Hero');
  });

  it('falls back to the first level for invalid XP values', () => {
    expect(getLevel(-50).level).toBe(1);
    expect(getLevel(-50).name).toBe('Seedling');
  });
});

describe('calculateFootprint', () => {
  it('returns daily and annual totals with risk level', () => {
    const result = calculateFootprint({
      electricityKWh: 10,
      vehicleKm: 20,
      waterLitres: 100,
      foodType: 'veg',
      plasticPerDay: 2,
    });

    expect(result.daily.electricity).toBeGreaterThan(0);
    expect(result.dailyTotal).toBeGreaterThan(0);
    expect(result.annualTotal).toBeGreaterThan(result.dailyTotal);
    expect(result.riskLevel.level).toBeDefined();
  });

  it('uses default food factor for unknown diet types', () => {
    const result = calculateFootprint({
      electricityKWh: 0,
      vehicleKm: 0,
      waterLitres: 0,
      foodType: 'unknown',
      plasticPerDay: 0,
    });

    expect(result.daily.food).toBe(2.5);
  });

  it('supports all predefined diet factors', () => {
    expect(calculateFootprint({
      electricityKWh: 0,
      vehicleKm: 0,
      waterLitres: 0,
      foodType: 'veg',
      plasticPerDay: 0,
    }).daily.food).toBe(1.5);

    expect(calculateFootprint({
      electricityKWh: 0,
      vehicleKm: 0,
      waterLitres: 0,
      foodType: 'mixed',
      plasticPerDay: 0,
    }).daily.food).toBe(3.0);

    expect(calculateFootprint({
      electricityKWh: 0,
      vehicleKm: 0,
      waterLitres: 0,
      foodType: 'meat_heavy',
      plasticPerDay: 0,
    }).daily.food).toBe(5.0);
  });
});

describe('AvatarSVG helpers', () => {
  it('parses svg avatar ids', () => {
    expect(parseSvgAvatarId('__svg__c3')).toBe('c3');
    expect(parseSvgAvatarId('https://example.com/a.png')).toBeNull();
    expect(parseSvgAvatarId(null)).toBeNull();
  });
});
