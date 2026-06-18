import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import Icon from '../components/shared/Icon';

const rawBackend = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://ecoquest-production-ca0e.up.railway.app';
const BACKEND = rawBackend.replace(/\/+$/, '');

/* ── Gmail Validator Logic ───────────────────────────────────────────────── */
const isValidGmail = (v) => /^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(v.trim());
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const getEmailState = (v) => {
  if (!v) return null;
  if (isValidGmail(v)) return 'gmail';
  if (isValidEmail(v)) return 'valid';
  return 'invalid';
};

const EMAIL_HINTS = {
  gmail:   { color: '#00C896', bg: 'rgba(0,200,150,0.08)',  border: '#00C896',  icon: '✓', text: 'Valid Gmail address' },
  valid:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: '#F59E0B',  icon: '⚠', text: 'Valid email — Gmail recommended for best experience' },
  invalid: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: '#EF4444',  icon: '✗', text: 'Please enter a valid email address' },
};

function EmailInput({ value, onChange, touched, setTouched, dark = true }) {
  const state  = touched ? getEmailState(value) : (value ? getEmailState(value) : null);
  const hint   = state ? EMAIL_HINTS[state] : null;
  const border = hint ? hint.border : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)');
  const bg     = hint ? hint.bg : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)');
  const textColor = dark ? '#FFFFFF' : 'var(--text-primary)';

  return (
    <div>
      <label style={{
        fontSize: '0.8rem',
        color: dark ? 'rgba(240,253,244,0.6)' : 'var(--text-muted)',
        display: 'block', marginBottom: '8px', fontWeight: 500,
      }}>
        Email Address *
        <AnimatePresence>
          {state === 'gmail' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                marginLeft: '8px', fontSize: '0.68rem',
                background: 'rgba(0,200,150,0.18)', color: '#00C896',
                padding: '2px 8px', borderRadius: '20px', fontWeight: 700,
              }}
            >
              Gmail ✓
            </motion.span>
          )}
        </AnimatePresence>
      </label>

      <div style={{ position: 'relative' }}>
        <input
          type="email"
          placeholder="yourname@gmail.com"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          autoComplete="email"
          style={{
            width: '100%',
            padding: '14px 44px 14px 16px',
            borderRadius: '12px',
            background: bg,
            border: `1.5px solid ${border}`,
            color: textColor,
            outline: 'none',
            fontSize: '0.95rem',
            transition: 'border-color 0.25s, background 0.25s',
            boxSizing: 'border-box',
          }}
        />
        <AnimatePresence>
          {hint && (
            <motion.span
              key={state}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', right: '14px', top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1rem', color: hint.color,
                fontWeight: 700, lineHeight: 1, pointerEvents: 'none',
              }}
            >
              {hint.icon}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.p
            key={state}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: '6px', fontSize: '0.74rem',
              color: hint.color, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {hint.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── SVG Icons ─────────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ── Perks list ─────────────────────────────────────────────────────────── */
const PERKS = [
  { icon: <Icon name="bar-chart-2" color="#00C896" size={20} />, text: 'Real-time carbon tracking' },
  { icon: <Icon name="trophy"      color="#00C896" size={20} />, text: 'Earn badges & level up' },
  { icon: <Icon name="lightbulb"  color="#00C896" size={20} />, text: 'AI-powered suggestions' },
  { icon: <Icon name="globe"      color="#00C896" size={20} />, text: 'Join 2.4M eco-warriors' },
];

/* ── Signup / Login Page ─────────────────────────────────────────────────── */
export default function Signup() {
  const location  = useLocation();
  const isLogin   = location.pathname === '/login';
  const [searchParams, setSearchParams] = useSearchParams();
  const oauthErrorHandled = useRef(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', district: '', state: '', agree: false });
  const [loading, setLoading]             = useState(false);
  const [strength, setStrength]           = useState(0);
  const [emailTouched, setEmailTouched]   = useState(false);
  const [oauthStatus, setOauthStatus]     = useState({ google: true });

  const { register, login } = useAuthStore();
  const navigate = useNavigate();

  // Handle ?error= params set by backend OAuth failure redirects
  useEffect(() => {
    if (oauthErrorHandled.current) return;
    const err = searchParams.get('error');
    if (!err) return;
    oauthErrorHandled.current = true;

    const messages = {
      google_failed:          '❌ Google sign-in failed. Please try email/password.',
      oauth_code_failed:      '❌ Could not generate a sign-in code. Please try again.',
      google_not_configured:  '⚙️ Google sign-in is not set up on this server.',
    };
    toast.error(messages[err] || '❌ Sign-in failed. Please try again.', { autoClose: 6000 });

    // Remove the ?error= param from the URL so refreshing doesn't re-show the toast
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch which OAuth providers are live on the backend
  useEffect(() => {
    fetch(`${BACKEND}/api/auth/oauth-status`)
      .then(r => r.json())
      .then(data => setOauthStatus(data))
      .catch(() => {});
  }, []);

  const handleOAuth = (provider) => {
    if (!oauthStatus[provider]) {
      toast.info('🔧 Google login not configured. Add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET to backend/.env', { autoClose: 7000 });
      return;
    }
    // Save the intended destination across the OAuth round-trip
    const redirectTo = searchParams.get('redirect');
    if (redirectTo) {
      sessionStorage.setItem('oauth_redirect', decodeURIComponent(redirectTo));
    } else {
      sessionStorage.removeItem('oauth_redirect');
    }
    window.location.href = `${BACKEND}/api/auth/${provider}`;
  };

  const checkStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)          score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setStrength(score);
  };

  const strengthColors = ['#EF4444', '#F97316', '#F59E0B', '#00C896'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!isValidEmail(form.email)) {
      toast.error('Please enter a valid email address (e.g. yourname@gmail.com)');
      return;
    }
    if (!isLogin && !form.name) {
      toast.error('Please enter your full name');
      return;
    }
    if (!isLogin && !form.district.trim()) {
      toast.error('Please enter your district / city');
      return;
    }
    if (!isLogin && !form.state.trim()) {
      toast.error('Please enter your state');
      return;
    }
    if (!isLogin && form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isLogin && !form.agree) {
      toast.error('Please agree to the terms');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    let result;
    if (isLogin) {
      result = await login({ email: form.email, password: form.password });
    } else {
      result = await register({
        name:     form.name,
        email:    form.email,
        password: form.password,
        district: form.district.trim(),
        state:    form.state.trim(),
      });
    }

    if (result.success) {
      toast.success(isLogin ? '🌿 Welcome back to EcoQuest!' : '🎉 Welcome to EcoQuest! Your journey begins!');
      // Redirect to the page the user was trying to visit, or / as default
      const redirectTo = searchParams.get('redirect');
      navigate(redirectTo ? decodeURIComponent(redirectTo) : '/', { replace: true });
    } else {
      toast.error(result.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const darkInput = {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#FFFFFF', outline: 'none', transition: 'border 0.3s',
    boxSizing: 'border-box', fontSize: '0.95rem',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch', background: '#0A0F0D' }}>

      {/* ── LEFT — Info Panel ──────────────────────────────────────────── */}
      <div
        style={{
          flex: '0 0 420px',
          background: 'linear-gradient(135deg, #0F2D1A, #061A10)',
          padding: '60px 40px',
          borderRight: '1px solid rgba(0,200,150,0.15)',
          position: 'relative', overflow: 'hidden',
        }}
        className="hidden lg:flex lg:flex-col lg:justify-center"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{
            position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,150,0.2), transparent)',
            top: '-100px', right: '-100px',
          }}
        />

        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '48px', position: 'relative' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #00C896, #4ADE80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 0 20px rgba(0,200,150,0.4)',
          }}>🌿</div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #00C896, #4ADE80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            EcoQuest
          </span>
        </Link>

        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '16px', color: '#FFFFFF' }}>
            Start Your <span className="gradient-text">Green Journey</span> Today
          </h2>
          <p style={{ color: 'rgba(240,253,244,0.5)', lineHeight: 1.7, marginBottom: '32px', fontSize: '0.95rem' }}>
            Join millions of eco-warriors tracking their carbon footprint and making a real difference for our planet.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {PERKS.map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {perk.icon}
                </div>
                <span style={{ color: 'rgba(240,253,244,0.75)', fontSize: '0.9rem' }}>{perk.text}</span>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex' }}>
              {[1,2,3,4].map((_, i) => (
                <div key={i} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '2px solid rgba(0,200,150,0.5)',
                  background: `hsl(${140 + i * 15}, 60%, ${40 + i * 5}%)`,
                  marginLeft: i > 0 ? '-10px' : 0,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                }} />
              ))}
            </div>
            <p style={{ color: 'rgba(240,253,244,0.4)', fontSize: '0.82rem' }}>
              2.4M+ users already tracking
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ──────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: '440px' }}
        >
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLogin ? 'Welcome Back 👋' : 'Create Account 🌱'}
          </h1>
          <p style={{ color: 'rgba(240,253,244,0.5)', marginBottom: '28px', fontSize: '0.9rem' }}>
            {isLogin ? 'Continue your eco-journey.' : "It's free. No credit card needed."}
          </p>

          {/* ── Google Sign In Button ───────────────────────────────── */}
          <motion.button
            onClick={() => handleOAuth('google')}
            whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(66,133,244,0.28)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '13px 20px',
              borderRadius: '12px',
              background: oauthStatus.google
                ? 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(66,133,244,0.08))'
                : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${oauthStatus.google ? 'rgba(66,133,244,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: oauthStatus.google ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              fontSize: '0.95rem', fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              transition: 'all 0.2s',
              marginBottom: '24px',
            }}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
            {!oauthStatus.google && (
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(not configured)</span>
            )}
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(240,253,244,0.3)', fontSize: '0.8rem' }}>or with email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ── Form ─────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Name (signup only) */}
            {!isLogin && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'rgba(240,253,244,0.6)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={darkInput}
                  onFocus={e => e.target.style.borderColor = '#00C896'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            )}

            {/* ── Gmail Validator ─────────────────────────────────────── */}
            <EmailInput
              value={form.email}
              onChange={v => setForm(f => ({ ...f, email: v }))}
              touched={emailTouched}
              setTouched={setEmailTouched}
              dark={true}
            />

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'rgba(240,253,244,0.6)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password *</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); checkStrength(e.target.value); }}
                style={darkInput}
                onFocus={e => e.target.style.borderColor = '#00C896'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              {!isLogin && form.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strength > 0 ? strengthColors[strength - 1] : 'rgba(240,253,244,0.4)', fontWeight: 600 }}>
                    {strength > 0 ? strengthLabels[strength - 1] : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password (signup only) */}
            {!isLogin && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'rgba(240,253,244,0.6)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Confirm Password *</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  style={{
                    ...darkInput,
                    border: `1.5px solid ${form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                  onFocus={e => { if (!form.confirm || form.confirm === form.password) e.target.style.borderColor = '#00C896'; }}
                  onBlur={e => { if (!form.confirm || form.confirm === form.password) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                {form.confirm && form.confirm !== form.password && (
                  <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>Passwords don't match</p>
                )}
              </div>
            )}

            {/* District + State (signup only) */}
            {!isLogin && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(240,253,244,0.6)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>District / City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={form.district}
                    onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                    style={darkInput}
                    onFocus={e => e.target.style.borderColor = '#00C896'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(240,253,244,0.6)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>State *</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    style={darkInput}
                    onFocus={e => e.target.style.borderColor = '#00C896'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={e => setForm(f => ({ ...f, agree: e.target.checked }))}
                  style={{ accentColor: '#00C896', marginTop: '2px', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.82rem', color: 'rgba(240,253,244,0.45)', lineHeight: 1.5 }}>
                  I agree to EcoQuest's{' '}
                  <a href="#" style={{ color: '#00C896' }}>Terms of Service</a> and{' '}
                  <a href="#" style={{ color: '#00C896' }}>Privacy Policy</a>
                </span>
              </label>
            )}

            <motion.button
              type="submit"
              className="btn-primary"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              <span>{loading ? '⏳ Please wait...' : isLogin ? 'Login to EcoQuest' : '🚀 Join EcoQuest Free'}</span>
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(240,253,244,0.4)', fontSize: '0.875rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link to={isLogin ? '/signup' : '/login'} style={{ color: '#00C896', fontWeight: 600, textDecoration: 'none' }}>
              {isLogin ? 'Sign up →' : 'Sign in →'}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
