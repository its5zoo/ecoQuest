import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import OAuthCallback from '../pages/OAuthCallback';
import useAuthStore from '../store/authStore';

const Home       = lazy(() => import('../pages/Home'));
const News       = lazy(() => import('../pages/News'));
const Tracker    = lazy(() => import('../pages/Tracker'));
const Calculator = lazy(() => import('../pages/Calculator'));
const Profile    = lazy(() => import('../pages/Profile'));
const Signup     = lazy(() => import('../pages/Signup'));
const Community  = lazy(() => import('../pages/Community'));

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2,  ease: 'easeIn'  } },
};

function PageWrapper({ children }) {
  const prefersReduced = useReducedMotion();

  const variants = prefersReduced
    ? {
        initial: { opacity: 0 },
        enter:   { opacity: 1, transition: { duration: 0 } },
        exit:    { opacity: 0, transition: { duration: 0 } },
      }
    : pageVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: prefersReduced ? 'auto' : 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </motion.div>
  );
}

function PageLoader() {
  return (
    <div role="status" aria-live="polite" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  );
}

/**
 * ProtectedRoute — if not authenticated, redirects to /login
 * and preserves the intended URL as ?redirect=/path
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, getToken } = useAuthStore();
  const location = useLocation();

  // Must have both the flag AND a real JWT
  if (!isAuthenticated || !getToken()) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return children;
}

/**
 * GuestOnlyRoute — if already authenticated, redirect to profile
 * (prevents logged-in users from seeing the login/signup page)
 */
function GuestOnlyRoute({ children }) {
  const { isAuthenticated, getToken } = useAuthStore();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get('redirect');

  if (isAuthenticated && getToken()) {
    return <Navigate to={redirectTo ? decodeURIComponent(redirectTo) : '/'} replace />;
  }

  return children;
}

export default function Router() {
  const location = useLocation();

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>

            {/* ── Public routes ─────────────────────────────────── */}
            <Route path="/"            element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/news"        element={<PageWrapper><News /></PageWrapper>} />
            <Route path="/calculator"  element={<PageWrapper><Calculator /></PageWrapper>} />

            {/* ── Guest-only (redirect away if already logged in) ─ */}
            <Route path="/login"  element={<GuestOnlyRoute><PageWrapper><Signup /></PageWrapper></GuestOnlyRoute>} />
            <Route path="/signup" element={<GuestOnlyRoute><PageWrapper><Signup /></PageWrapper></GuestOnlyRoute>} />

            {/* ── OAuth callback — no auth required ─────────────── */}
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* ── Protected routes ───────────────────────────────── */}
            <Route path="/tracker"   element={<ProtectedRoute><PageWrapper><Tracker /></PageWrapper></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><PageWrapper><Community /></PageWrapper></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />

          </Routes>
        </AnimatePresence>
      </Suspense>
    </Layout>
  );
}
