import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from './authStore';

describe('useAuthStore session helpers', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('returns null for mock or malformed tokens', () => {
    useAuthStore.setState({ token: 'mock-token-fallback', isAuthenticated: true });
    expect(useAuthStore.getState().getToken()).toBeNull();

    useAuthStore.setState({ token: 'not-a-jwt', isAuthenticated: true });
    expect(useAuthStore.getState().getToken()).toBeNull();
  });

  it('returns real JWT tokens', () => {
    const jwt = 'header.payload.signature';
    useAuthStore.setState({ token: jwt, isAuthenticated: true });
    expect(useAuthStore.getState().getToken()).toBe(jwt);
  });

  it('clears stale mock sessions during validation', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Guest' },
      token: 'mock-token-fallback',
      isAuthenticated: true,
    });

    useAuthStore.getState().validateSession();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('clears expired JWT sessions during validation', () => {
    const expiredPayload = btoa(JSON.stringify({ exp: 1 }));
    const expiredToken = `header.${expiredPayload}.signature`;

    useAuthStore.setState({
      user: { id: '1', name: 'Guest' },
      token: expiredToken,
      isAuthenticated: true,
    });

    useAuthStore.getState().validateSession();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    expect(useAuthStore.getState().getToken()).toBeNull();
  });
});
