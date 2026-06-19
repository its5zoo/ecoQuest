import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware');
  return {
    ...actual,
    persist: (initializer) => initializer,
  };
});

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('../services/apiClient', () => ({
  default: vi.fn(() => Promise.resolve({})),
}));

vi.mock('./authStore', () => ({
  default: {
    getState: () => ({ getToken: () => null }),
    setState: vi.fn(),
  },
}));

import useTrackerStore from './trackerStore';
import { calcDailyScore, getLevel } from '../utils/carbonLogic';

describe('useTrackerStore', () => {
  beforeEach(() => {
    useTrackerStore.setState({
      activities: [],
      totalXP: 0,
      streak: 0,
      coins: 0,
      badges: useTrackerStore.getState().badges.map((b) => ({ ...b, unlocked: false })),
      lastLogDate: null,
      plantedTrees: 0,
      forestLevel: 1,
    });
  });

  it('derives daily score from logged activities using backend-aligned formula', () => {
    useTrackerStore.getState().addActivity({
      name: 'Trip A',
      category: 'transport',
      quantity: 1,
      unit: 'km',
      carbonKg: 4,
    });
    useTrackerStore.getState().addActivity({
      name: 'Trip B',
      category: 'transport',
      quantity: 1,
      unit: 'km',
      carbonKg: 6,
    });

    const today = new Date().toDateString();
    const total = useTrackerStore.getState().activities
      .filter((a) => new Date(a.timestamp).toDateString() === today)
      .reduce((sum, a) => sum + (a.carbonKg || 0), 0);

    expect(total).toBe(10);
    expect(calcDailyScore(total)).toBe(90);
  });

  it('awards XP using backend daily-difference logic on first activity', () => {
    const result = useTrackerStore.getState().addActivity({
      name: 'Walk',
      category: 'transport',
      quantity: 1,
      unit: 'km',
      carbonKg: 0,
    });

    expect(result.xpEarned).toBe(150);
    expect(useTrackerStore.getState().totalXP).toBe(150);
  });

  it('unlocks the first-step badge on initial activity', () => {
    useTrackerStore.getState().addActivity({
      name: 'Bus ride',
      category: 'transport',
      quantity: 5,
      unit: 'km',
      carbonKg: 0.5,
    });

    const firstStep = useTrackerStore.getState().badges.find((b) => b.id === 'first_step');
    expect(firstStep?.unlocked).toBe(true);
  });

  it('reports level 10 once total XP reaches the climate hero threshold', () => {
    useTrackerStore.setState({ totalXP: 35000 });
    const level = getLevel(useTrackerStore.getState().totalXP);
    expect(level.level).toBe(10);
    expect(level.name).toBe('Climate Hero');
  });
});
