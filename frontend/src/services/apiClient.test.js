import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, getApiBase, getBackendOrigin } from './apiClient';

describe('getApiBase', () => {
  it('returns a normalized API root ending in /api', () => {
    expect(getApiBase()).toMatch(/\/api$/);
  });

  it('normalizes custom VITE_API_URL values', async () => {
    vi.stubEnv('VITE_API_URL', 'https://example.com/custom/');
    vi.resetModules();
    const mod = await import('./apiClient');
    expect(mod.getApiBase()).toBe('https://example.com/custom/api');
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('getBackendOrigin', () => {
  it('strips the /api suffix from the API root', () => {
    expect(getBackendOrigin()).toBe(getApiBase().replace(/\/api$/, ''));
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await expect(apiRequest('/health')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      `${getApiBase()}/health`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('throws with status and data on non-2xx responses', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    await expect(apiRequest('/secure')).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401,
      data: { message: 'Unauthorized' },
    });
  });

  it('handles invalid JSON bodies gracefully', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid json');
      },
    });

    await expect(apiRequest('/broken')).rejects.toMatchObject({
      status: 500,
      data: {},
    });
  });

  it('uses a fallback error message when the API omits one', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(apiRequest('/down')).rejects.toMatchObject({
      message: 'Request failed (503)',
      status: 503,
    });
  });

  it('serializes JSON bodies for write requests', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ saved: true }),
    });

    await apiRequest('/items', { method: 'POST', body: { name: 'test' } });

    expect(fetch).toHaveBeenCalledWith(
      `${getApiBase()}/items`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })
    );
  });

  it('includes auth headers when a token is provided', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest('/me', { token: 'jwt-token' });

    expect(fetch).toHaveBeenCalledWith(
      `${getApiBase()}/me`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
      })
    );
  });
});
