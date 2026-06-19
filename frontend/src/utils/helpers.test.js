import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatNumber,
  formatCarbon,
  formatDate,
  timeAgo,
  truncate,
  getScoreColor,
  getProgressGradient,
  generateHeatmapData,
  clamp,
  getWeekNumber,
  parseSvgAvatarId,
} from './helpers';

describe('formatNumber', () => {
  it('formats numbers with optional decimals', () => {
    expect(formatNumber(1234)).toContain('1');
    expect(formatNumber(12.345, 2)).toContain('12');
  });

  it('returns zero for non-finite values', () => {
    expect(formatNumber(NaN)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
  });
});

describe('formatCarbon', () => {
  it('formats tiny, gram, and kilogram values', () => {
    expect(formatCarbon(0.0001)).toBe('< 0.001 kg');
    expect(formatCarbon(0.5)).toBe('500 g');
    expect(formatCarbon(2.456)).toBe('2.46 kg');
  });
});

describe('formatDate', () => {
  it('returns N/A for invalid or missing dates', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate('invalid-date')).toBe('N/A');
  });

  it('formats valid dates', () => {
    expect(formatDate('2024-06-15')).toContain('2024');
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns N/A for invalid input', () => {
    expect(timeAgo(null)).toBe('N/A');
    expect(timeAgo('bad-date')).toBe('N/A');
  });

  it('returns relative time buckets', () => {
    expect(timeAgo('2024-06-15T11:59:30.000Z')).toBe('Just now');
    expect(timeAgo('2024-06-15T11:30:00.000Z')).toBe('30m ago');
    expect(timeAgo('2024-06-15T09:00:00.000Z')).toBe('3h ago');
    expect(timeAgo('2024-06-13T12:00:00.000Z')).toBe('2d ago');
    expect(timeAgo('2024-05-01T12:00:00.000Z')).toContain('2024');
  });
});

describe('truncate', () => {
  it('returns original text when under the limit', () => {
    expect(truncate('short')).toBe('short');
  });

  it('returns empty string for nullish input', () => {
    expect(truncate(null)).toBe('');
  });

  it('truncates long text with ellipsis', () => {
    const result = truncate('a'.repeat(120), 100);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(101);
  });
});

describe('score styling helpers', () => {
  it('returns colors and gradients for score bands', () => {
    expect(getScoreColor(10)).toBe('#00C896');
    expect(getScoreColor(45)).toBe('#F59E0B');
    expect(getScoreColor(70)).toBe('#F97316');
    expect(getScoreColor(90)).toBe('#EF4444');

    expect(getProgressGradient(10)).toContain('#00C896');
    expect(getProgressGradient(45)).toContain('#F59E0B');
    expect(getProgressGradient(70)).toContain('#F97316');
    expect(getProgressGradient(90)).toContain('#EF4444');
  });
});

describe('generateHeatmapData', () => {
  it('builds one year of daily counts from activities', () => {
    const todayIso = new Date().toISOString().split('T')[0];
    const data = generateHeatmapData([
      { timestamp: `${todayIso}T10:00:00.000Z`, carbonKg: 10 },
    ]);

    expect(data.length).toBeGreaterThan(300);
    const match = data.find((entry) => entry.date === todayIso);
    expect(match).toBeDefined();
    expect(match.count).toBeGreaterThan(0);
  });

  it('handles activities without carbon values', () => {
    const todayIso = new Date().toISOString().split('T')[0];
    const data = generateHeatmapData([
      { timestamp: `${todayIso}T10:00:00.000Z` },
    ]);

    const match = data.find((entry) => entry.date === todayIso);
    expect(match.count).toBeGreaterThan(0);
  });
});

describe('clamp', () => {
  it('restricts values to the provided range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(20, 0, 10)).toBe(10);
  });
});

describe('getWeekNumber', () => {
  it('returns a positive week number', () => {
    expect(getWeekNumber()).toBeGreaterThan(0);
  });

  it('handles week calculations when the current day is Sunday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-16T12:00:00.000Z'));
    expect(getWeekNumber()).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});

describe('parseSvgAvatarId', () => {
  it('parses svg avatar ids', () => {
    expect(parseSvgAvatarId('__svg__c3')).toBe('c3');
    expect(parseSvgAvatarId('https://example.com/a.png')).toBeNull();
  });
});
