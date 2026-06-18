import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';

// ─── Module-level Map: code → Promise<result> ───────────────────────────────
// Prevents React StrictMode's double-invoke from sending two exchange requests.
const pendingExchanges = new Map();

export default function OAuthCallback() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { exchangeOAuthCode } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const code  = params.get('code');
      const error = params.get('error');

      // ── Backend sent an error redirect ────────────────────────────────────
      if (error) {
        if (!mounted) return;
        const messages = {
          google_failed:         'Google sign-in was cancelled or failed.',
          oauth_code_failed:     'Could not generate a sign-in code. Please try again.',
          google_not_configured: 'Google sign-in is not configured on this server.',
        };
        toast.error(messages[error] || 'Social login failed. Please try again.', { autoClose: 5000 });
        navigate('/login', { replace: true });
        return;
      }

      if (!code) {
        if (!mounted) return;
        toast.error('Invalid OAuth response. Please try again.');
        navigate('/login', { replace: true });
        return;
      }

      // ── De-duplicate: reuse the in-flight promise if already running ──────
      if (!pendingExchanges.has(code)) {
        pendingExchanges.set(code, exchangeOAuthCode(code));
      }

      const result = await pendingExchanges.get(code);
      setTimeout(() => pendingExchanges.delete(code), 3000);

      if (!mounted) return;

      if (!result.success) {
        toast.error(result.message || 'Sign-in failed. Please use email/password instead.', {
          autoClose: 5000,
        });
        navigate('/login', { replace: true });
        return;
      }

      toast.success(`🌿 Welcome, ${result.user?.name || 'Eco Warrior'}!`);

      // ── Respect any saved redirect from before the OAuth flow ─────────────
      // e.g. user tried to visit /community → sent to /login?redirect=%2Fcommunity
      // → clicked Google → we stored the redirect in sessionStorage → restore it now
      const savedRedirect = sessionStorage.getItem('oauth_redirect');
      sessionStorage.removeItem('oauth_redirect');
      navigate(savedRedirect || '/', { replace: true });
    };

    run();
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Signing you in"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        background: 'linear-gradient(135deg, #0A0F0D 0%, #0F2D1A 100%)',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '56px', height: '56px',
          borderRadius: '50%',
          border: '4px solid rgba(0,200,150,0.2)',
          borderTopColor: '#00C896',
        }}
      />
      <p style={{ color: 'rgba(240,253,244,0.6)', fontSize: '1rem', fontWeight: 500 }}>
        Signing you in…
      </p>
    </div>
  );
}
