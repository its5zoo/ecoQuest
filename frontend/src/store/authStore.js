import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiRequest from '../services/apiClient';
import useTrackerStore from './trackerStore';

/* ─── Map raw backend user object → UI user shape ──────────── */
const mapUser = (data) => {
  const mapped = {
    id:        data._id,
    name:      data.name,
    email:     data.email,
    avatar:    data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=00C896&color=0A0F0D&size=128`,
    joinDate:  data.createdAt,
    ecoRank:   'Seedling',
    district:  data.district,
    state:     data.state,
    country:   data.country,
    xp:        data.xp        || 0,
    level:     data.level     || 1,
    streak:    data.streak    || 0,
    carbonSaved: data.carbonSaved || 0,
    globalRank:  data.globalRank   ?? null,
    stateRank:   data.stateRank    ?? null,
    districtRank: data.districtRank ?? null,
    bio:       data.bio || '',
  };

  // Sync the local tracker store with backend-persisted progress values
  useTrackerStore.setState({
    totalXP: mapped.xp ?? 0,
    streak: mapped.streak ?? 0,
  });

  return mapped;
};

/* ─── Detect whether a stored token is a real JWT ────────────
   Real JWTs have three dot-separated Base64url segments.
   Old mock tokens like "mock-token-fallback" do not.          */
const isRealJwt = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token === 'mock-token-fallback') return false;
  const parts = token.split('.');
  return parts.length === 3;
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,

      /* ── Login ─────────────────────────────────────────────── */
      login: async (credentials) => {
        try {
          const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: {
              email:    credentials.email,
              password: credentials.password,
            },
          });
          set({ user: mapUser(data.user), token: data.token, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return { success: false, message: error.message || 'Login failed' };
        }
      },

      /* ── Register ──────────────────────────────────────────── */
      register: async (data) => {
        try {
          const resData = await apiRequest('/auth/signup', {
            method: 'POST',
            body: {
              name:     data.name,
              email:    data.email,
              password: data.password,
              district: data.district,
              state:    data.state,
              country:  data.country || 'India',
            },
          });
          set({ user: mapUser(resData.user), token: resData.token, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return { success: false, message: error.message || 'Registration failed' };
        }
      },

      /* ── OAuth ─────────────────────────────────────────────── */
      exchangeOAuthCode: async (code) => {
        try {
          const data = await apiRequest('/auth/oauth/exchange', {
            method: 'POST',
            body: { code },
          });
          const mappedUser = mapUser(data.user);
          set({ user: mappedUser, token: data.token, isAuthenticated: true });
          return { success: true, user: mappedUser };
        } catch (error) {
          return { success: false, message: error.message || 'OAuth exchange failed' };
        }
      },

      /* ── Logout ────────────────────────────────────────────── */
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      /* ── Update Profile ────────────────────────────────────── */
      updateUser: async (updates) => {
        // Optimistic local update
        set((state) => ({ user: { ...state.user, ...updates } }));

        const token = get().token;
        if (!token || !isRealJwt(token)) return { success: true };

        try {
          const updatedUser = await apiRequest('/auth/me', {
            method: 'PUT',
            token,
            body: updates,
          });
          set((state) => ({
            user: {
              ...state.user,
              ...mapUser(updatedUser),
              // Preserve locally-set avatar if backend didn't echo it back
              avatar: updatedUser.avatar || state.user?.avatar,
            },
          }));
          return { success: true };
        } catch (error) {
          if (error.status === 401) {
            // Token expired — force logout
            set({ user: null, token: null, isAuthenticated: false });
            return { success: false, message: 'Session expired. Please log in again.' };
          }
          return { success: false, message: error.message || 'Failed to sync with server' };
        }
      },

      /* ── Validate token on app start / re-hydration ─────────
         Call this once in App.jsx useEffect to auto-logout
         users who have a stale mock token in localStorage.    */
      validateSession: () => {
        const { token, isAuthenticated } = get();
        if (isAuthenticated && (!isRealJwt(token) || isTokenExpired(token))) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      /* ── Helper for other services ─────────────────────────── */
      getToken: () => {
        const token = get().token;
        if (!isRealJwt(token) || isTokenExpired(token)) return null;
        return token;
      },
    }),
    {
      name: 'ecoquest-auth-v2',   // bumped key to clear old mock-token localStorage
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
