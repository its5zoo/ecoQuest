import { describe, it, expect } from 'vitest';
import { generateSmartInsights, generateLiveScoreMessage } from './aiEngine';

describe('generateSmartInsights', () => {
  it('returns an onboarding insight when no activities exist', () => {
    expect(generateSmartInsights([])).toEqual([
      {
        message: 'Log more activities to let the AI analyze your carbon footprint trends!',
        type: 'info',
        category: 'General',
      },
    ]);
  });

  it('returns praise insight for low weekly totals', () => {
    const insights = generateSmartInsights([{ category: 'transport', carbonKg: 2 }]);
    expect(insights.some((insight) => insight.type === 'praise')).toBe(true);
  });

  it('returns a stable fallback insight when no rules match', () => {
    const insights = generateSmartInsights([
      { category: 'transport', carbonKg: 20 },
      { category: 'food', carbonKg: 15 },
    ]);

    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('suggestion');
  });
});

describe('generateLiveScoreMessage', () => {
  it('uses positive templates for low-impact activities', () => {
    const message = generateLiveScoreMessage(
      { category: 'transport', carbonKg: 2 },
      () => 0
    );

    expect(message).toContain('Transport');
  });

  it('uses high-impact templates for heavy activities', () => {
    const message = generateLiveScoreMessage(
      { category: 'transport', carbonKg: 8 },
      () => 0
    );

    expect(message).toContain('8.0kg');
  });

  it('handles missing carbon values without throwing', () => {
    expect(() => generateLiveScoreMessage({ category: 'food' }, () => 0)).not.toThrow();
  });

  it('falls back to the raw category when labels are unavailable', () => {
    const message = generateLiveScoreMessage({ carbonKg: 1, category: 'custom' }, () => 0);
    expect(message).toContain('custom');
  });
});
