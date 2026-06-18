import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'react-toastify/dist/ReactToastify.css';
import Router from './routes/Router';
import useAuthStore from './store/authStore';
import useTrackerStore from './store/trackerStore';
import apiRequest from './services/apiClient';

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
