import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLeaderboard, fetchMyRanks, mapLeaderboardEntry } from './leaderboardService';
import apiRequest from './apiClient';

vi.mock('./apiClient', () => ({
  default: vi.fn(),
}));

describe('mapLeaderboardEntry', () => {
  it('maps API entries and flags the current user', () => {
    const mapped = mapLeaderboardEntry(
      {
        _id: 'abc123',
        rank: 2,
        name: 'Eco Hero',
        avatar: '',
        level: 3,
        xp: 1800,
        carbonSaved: 12.5,
        district: 'Pune',
        state: 'Maharashtra',
      },
      'abc123'
    );

    expect(mapped).toMatchObject({
      id: 'abc123',
      rank: 2,
      name: 'Eco Hero',
      totalXP: 1800,
      carbonSaved: '12.5',
      isMe: true,
    });
  });

  it('defaults missing numeric fields safely', () => {
    const mapped = mapLeaderboardEntry({ _id: 'x1', rank: 10, name: 'Guest' }, null);

    expect(mapped).toMatchObject({
      level: 1,
      totalXP: 0,
      carbonSaved: '0.0',
    });
    expect(Boolean(mapped.isMe)).toBe(false);
  });
});

describe('fetchLeaderboard', () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  it('defaults unknown scopes to global leaderboard queries', async () => {
    apiRequest.mockResolvedValue({ leaderboard: [] });

    await fetchLeaderboard({ scope: 'Unknown', token: 'jwt-token' });

    expect(apiRequest.mock.calls[0][0]).toContain('scope=global');
  });

  it('maps UI scopes to backend query params', async () => {
    apiRequest.mockResolvedValue({ leaderboard: [] });

    await fetchLeaderboard({
      scope: 'District',
      region: 'Pune',
      page: 2,
      limit: 25,
      token: 'jwt-token',
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining('scope=district'),
      { token: 'jwt-token' }
    );
    expect(apiRequest.mock.calls[0][0]).toContain('region=Pune');
    expect(apiRequest.mock.calls[0][0]).toContain('page=2');
    expect(apiRequest.mock.calls[0][0]).toContain('limit=25');
  });
});

describe('fetchMyRanks', () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  it('requests the authenticated rank endpoint', async () => {
    apiRequest.mockResolvedValue({ globalRank: 1 });

    await expect(fetchMyRanks('jwt-token')).resolves.toEqual({ globalRank: 1 });
    expect(apiRequest).toHaveBeenCalledWith('/leaderboard/my-rank', { token: 'jwt-token' });
  });
});
