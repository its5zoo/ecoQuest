import apiRequest from './apiClient';

const SCOPE_MAP = {
  District: 'district',
  State:    'state',
  India:    'global',
  Country:  'global',
};

/**
 * Fetch leaderboard from backend.
 * Returns { leaderboard, me, total, totalPages, page, scope, region }
 */
export async function fetchLeaderboard({ scope, region, page = 1, limit = 50, token }) {
  const apiScope = SCOPE_MAP[scope] || 'global';
  const params = new URLSearchParams({
    scope: apiScope,
    page:  String(page),
    limit: String(limit),
  });
  if (region && apiScope !== 'global') params.set('region', region);

  const data = await apiRequest(`/leaderboard?${params}`, { token });
  return data;
}

/**
 * Map a raw API leaderboard entry to a UI-friendly format.
 */
export function mapLeaderboardEntry(entry, currentUserId) {
  return {
    id:          String(entry._id),
    rank:        entry.rank,
    name:        entry.name,
    avatar:      entry.avatar || '',
    level:       entry.level  || 1,
    totalXP:     entry.xp     || 0,
    carbonSaved: entry.carbonSaved != null ? Number(entry.carbonSaved).toFixed(1) : '0.0',
    district:    entry.district || '',
    state:       entry.state    || '',
    isMe:        Boolean(entry.isMe) || (currentUserId && String(entry._id) === String(currentUserId)),
  };
}

/**
 * Fetch the logged-in user's genuine ranks and total user counts from backend.
 */
export async function fetchMyRanks(token) {
  const data = await apiRequest('/leaderboard/my-rank', { token });
  return data;
}
