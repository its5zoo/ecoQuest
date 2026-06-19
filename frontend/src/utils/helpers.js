/**
 * Format a number with commas
 */
export function formatNumber(n, decimals = 0) {
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format kg CO2 nicely
 */
export function formatCarbon(kg) {
  if (kg < 0.001) return '< 0.001 kg';
  if (kg < 1) return `${(kg * 1000).toFixed(0)} g`;
  return `${kg.toFixed(2)} kg`;
}

/**
 * Format a date string
 */
export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
}

/**
 * Format time ago
 */
export function timeAgo(dateStr) {
  if (!dateStr) return 'N/A';
  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)    return 'Just now';
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffHours < 24)  return `${diffHours}h ago`;
  if (diffDays < 7)    return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Truncate text
 */
export function truncate(str, maxLen = 100) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

/**
 * Get color for a carbon score (0-100)
 */
export function getScoreColor(score) {
  if (score < 30) return '#00C896';
  if (score < 60) return '#F59E0B';
  if (score < 80) return '#F97316';
  return '#EF4444';
}

/**
 * Get progress bar gradient based on score
 */
export function getProgressGradient(score) {
  if (score < 30) return 'linear-gradient(90deg, #00C896, #4ADE80)';
  if (score < 60) return 'linear-gradient(90deg, #F59E0B, #FCD34D)';
  if (score < 80) return 'linear-gradient(90deg, #F97316, #FB923C)';
  return 'linear-gradient(90deg, #EF4444, #F87171)';
}

/**
 * Generate mock heatmap data for the past year
 */
export function generateHeatmapData(activities = []) {
  const result = [];
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayActivities = activities.filter(
      a => a.timestamp?.startsWith(dateStr)
    );
    const total = dayActivities.reduce((sum, a) => sum + (a.carbonKg || 0), 0);
    result.push({
      date: dateStr,
      count: dayActivities.length > 0 ? Math.min(4, Math.ceil(total / 5) + 1) : 0,
    });
  }
  return result;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get current week number
 */
export function getWeekNumber() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Parse SVG Avatar ID from storage format
 */
export function parseSvgAvatarId(avatar) {
  if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('__svg__')) return null;
  return avatar.replace('__svg__', '');
}

