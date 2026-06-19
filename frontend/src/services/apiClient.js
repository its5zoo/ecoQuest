const rawApi = import.meta.env.VITE_API_URL || 'https://ecoquest-production-ca0e.up.railway.app/api';
const cleanApi = rawApi.replace(/\/+$/, '');
const API_BASE = cleanApi.endsWith('/api') ? cleanApi : `${cleanApi}/api`;

/** Normalized API root including `/api` suffix. */
export function getApiBase() {
  return API_BASE;
}

/** Backend origin without the `/api` path segment. */
export function getBackendOrigin() {
  return API_BASE.replace(/\/api$/, '');
}

/**
 * Central fetch wrapper.
 * Throws an Error with `err.status` (HTTP status code) and `err.data` on non-2xx.
 */
export async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

export default apiRequest;
