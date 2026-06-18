import { describe, it, expect } from 'vitest';
import { calcActivityCarbon, getLevel, calcDailyScore } from './carbonLogic';
import { parseSvgAvatarId } from '../components/shared/AvatarSVG';

describe('carbonLogic', () => {
  it('calculates transport emissions', () => {
    expect(calcActivityCarbon('car_petrol', 10)).toBe(2.1);
  });

  it('returns zero for unknown factors', () => {
    expect(calcActivityCarbon('unknown_factor', 10)).toBe(0);
  });

  it('computes daily score from carbon footprint', () => {
    expect(calcDailyScore(0)).toBe(0);
    expect(calcDailyScore(15)).toBe(50);
    expect(calcDailyScore(30)).toBe(100);
  });

  it('maps XP to levels', () => {
    expect(getLevel(0).level).toBe(1);
    expect(getLevel(500).level).toBeGreaterThanOrEqual(2);
  });
});

describe('AvatarSVG helpers', () => {
  it('parses svg avatar ids', () => {
    expect(parseSvgAvatarId('__svg__c3')).toBe('c3');
    expect(parseSvgAvatarId('https://example.com/a.png')).toBeNull();
  });
});
