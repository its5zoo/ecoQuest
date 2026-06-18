import { BrowserRouter } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'react-toastify/dist/ReactToastify.css';
import Router from './routes/Router';
import useAuthStore from './store/authStore';
import useTrackerStore from './store/trackerStore';
import apiRequest from './services/apiClient';
import { motion } from 'framer-motion';

function LocationRequiredModal() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);

  // Only show if logged in but location is Unknown
  const show = isAuthenticated && user && (user.district === 'Unknown' || user.state === 'Unknown');

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!district.trim() || !state.trim()) {
      toast.error('Please enter both your district/city and state.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUser({
        district: district.trim(),
        state: state.trim(),
      });
      if (res && res.success) {
        toast.success('📍 Location configured successfully! Welcome to EcoQuest!');
      } else {
        toast.error(res?.message || 'Failed to update location.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(10, 15, 13, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 20px 50px rgba(0, 200, 150, 0.15)',
          textAlign: 'center',
          color: '#1A2E22',
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 20px',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
        }}>
          📍
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Configure Your Location
        </h2>
        <p style={{ color: '#4B5563', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '28px' }}>
          EcoQuest calculates leaderboards at the district and state levels. Please enter your location details to continue.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>
              DISTRICT / CITY *
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid rgba(0, 0, 0, 0.08)',
                background: 'rgba(0, 0, 0, 0.01)',
                color: '#1F2937',
                outline: 'none',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#10B981'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>
              STATE *
            </label>
            <input
              type="text"
              placeholder="e.g. Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid rgba(0, 0, 0, 0.08)',
                background: 'rgba(0, 0, 0, 0.01)',
                color: '#1F2937',
                outline: 'none',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#10B981'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'}
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{loading ? '⏳ Updating...' : 'Complete Setup 🚀'}</span>
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function App() {
  const validateSession = useAuthStore((s) => s.validateSession);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Clear any stale mock-token sessions from old app versions
    validateSession();

    // Initialise AOS scroll animations
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tracker store totalXP and streak with authenticated user values on load/change
  useEffect(() => {
    if (isAuthenticated && user) {
      useTrackerStore.setState({
        totalXP: user.xp ?? 0,
        streak: user.streak ?? 0,
      });
    }
  }, [isAuthenticated, user]);

  // Sync logged-in user's activities from backend to update Profile page stats
  useEffect(() => {
    const syncActivities = async () => {
      if (isAuthenticated && token && token !== 'mock-token-fallback') {
        try {
          const data = await apiRequest('/tracker/all', { token });
          if (data && data.activities) {
            const mapped = data.activities.map(a => ({
              id: a._id,
              name: a.activityType,
              category: a.category,
              duration: a.duration,
              quantity: a.quantity,
              carbonKg: a.co2Generated,
              timestamp: a.timestamp
            }));
            useTrackerStore.setState({ activities: mapped });
          }
        } catch (err) {
          console.error('Failed to sync activities from backend:', err);
        }
      }
    };
    syncActivities();
  }, [isAuthenticated, token]);

  return (
    <BrowserRouter>
      <Router />
      <LocationRequiredModal />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          background:   '#FFFFFF',
          border:       '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          color:        'var(--text-primary)',
          boxShadow:    '0 4px 15px rgba(0, 0, 0, 0.05)',
        }}
      />
    </BrowserRouter>
  );
}
