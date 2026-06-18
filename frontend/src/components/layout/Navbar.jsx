import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import useTrackerStore from '../../store/trackerStore';
import Icon from '../shared/Icon';
import AvatarSVG from '../shared/AvatarSVG';
import { parseSvgAvatarId } from '../../utils/helpers';
import { keyboardActivate } from '../../utils/a11y';

function NavAvatar({ user, size = 36, onClick }) {
  const svgId = parseSvgAvatarId(user?.avatar);
  const containerStyle = {
    width: size, height: size, borderRadius: '50%',
    border: '2px solid #10B981',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.15)',
    cursor: 'pointer',
    overflow: 'hidden', flexShrink: 0,
    transition: 'all 0.2s ease',
    background: '#FFFFFF',
  };

  if (svgId) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${user?.name || 'User'} profile`}
        style={containerStyle}
        onClick={onClick}
        onKeyDown={keyboardActivate(onClick)}
      >
        <AvatarSVG svgId={svgId} />
      </div>
    );
  }

  return (
    <img
      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Guest'}`}
      alt={user?.name || 'User avatar'}
      style={containerStyle}
      onClick={onClick}
      onKeyDown={keyboardActivate(onClick)}
      role="button"
      tabIndex={0}
    />
  );
}

const NAV_LINKS = [
  { path: '/',           label: 'Home'       },
  { path: '/news',       label: 'EcoGuide'   },
  { path: '/tracker',    label: 'Tracker'    },
  { path: '/calculator', label: 'Calculator' },
  { path: '/community',  label: 'Community'  },
  { path: '/profile',    label: 'Profile'    },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Build the login link so after login the user returns to the current page.
  // Don't add redirect for public pages (/, /login, /signup).
  const PUBLIC_PATHS = ['/', '/login', '/signup', '/oauth-callback'];
  const loginHref = PUBLIC_PATHS.includes(location.pathname)
    ? '/login'
    : `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMenuOpen(false);
    });
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    useTrackerStore.setState({
      activities: [],
      totalXP: 0,
      streak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,
      coins: 0,
      plantedTrees: 0,
      forestLevel: 1,
    });
    navigate('/');
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '0 clamp(12px, 3vw, 32px)',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
          background: scrolled
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled
            ? '1px solid rgba(0, 0, 0, 0.08)'
            : '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* ── Logo ── */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Animated Leaf Logo */}
            <div style={{ position: 'relative' }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,200,150,0.4), transparent)',
                }}
              />
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00C896, #4ADE80)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                position: 'relative',
                boxShadow: '0 0 15px rgba(0,200,150,0.4)',
              }}>
                🌿
              </div>
            </div>
            <div>
              <span style={{
                fontFamily: "var(--font-heading)",
                fontSize: '1.3rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #00C896, #4ADE80)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}>
                EcoQuest
              </span>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: '0.58rem', color: 'rgba(0,200,150,0.7)', letterSpacing: '2.5px', marginTop: '-2px', fontWeight: 600 }}>
                CARBON TRACKER
              </div>
            </div>
          </motion.div>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div style={{ alignItems: 'center', gap: '4px' }} className="nav-desktop-links">
          {NAV_LINKS.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  position: 'relative',
                  padding: '8px 16px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'color 0.2s ease',
                }}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '16px',
                      right: '16px',
                      height: '2px',
                      borderRadius: '2px',
                      background: 'var(--primary)',
                      boxShadow: '0 -2px 10px rgba(0, 200, 150, 0.4)'
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Auth Section ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <NavAvatar user={user} size={38} onClick={() => navigate('/profile')} />
              </motion.div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.04, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.5)' }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.03)',
                  color: '#EF4444',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                className="nav-desktop-btn"
              >
                <Icon name="log-out" size={14} color="#EF4444" />
                Logout
              </motion.button>
            </div>
          ) : (
            <div style={{ gap: '10px' }} className="nav-desktop-links">
              <Link to={loginHref}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-outline"
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  Login
                </motion.button>
              </Link>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  <span>Sign Up</span>
                </motion.button>
              </Link>
            </div>
          )}

          {/* ── Mobile Hamburger only ── */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            style={{
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              flexDirection: 'column',
              gap: '4px',
              width: '44px',
              height: '44px',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            className="nav-mobile-hamburger"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              style={{ display: 'block', width: '18px', height: '2px', background: 'var(--primary)', borderRadius: '2px' }}
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              style={{ display: 'block', width: '18px', height: '2px', background: 'var(--primary)', borderRadius: '2px' }}
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              style={{ display: 'block', width: '18px', height: '2px', background: 'var(--primary)', borderRadius: '2px' }}
            />
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Mobile Menu Backdrop ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Menu Drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              right: 0,
              width: '80%',
              maxWidth: '320px',
              zIndex: 999,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(0, 0, 0, 0.05)',
              padding: '80px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Menu</span>
              <button 
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
            {NAV_LINKS.map((link, i) => {
              const isActive = location.pathname === link.path;
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.path}
                    style={{
                      display: 'block',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      textDecoration: 'none',
                      fontFamily: "var(--font-heading)",
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                      fontSize: '1.1rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '12px', paddingTop: '12px', display: 'flex', gap: '10px' }}>
              {isAuthenticated ? (
                <button onClick={handleLogout} style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', transition: 'all 0.2s ease' }}>
                  <Icon name="log-out" size={16} color="#EF4444" />
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" style={{ flex: 1 }}>
                    <button className="btn-outline" style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem' }}>Login</button>
                  </Link>
                  <Link to="/signup" style={{ flex: 1 }}>
                    <button className="btn-primary" style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem' }}><span>Sign Up</span></button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
