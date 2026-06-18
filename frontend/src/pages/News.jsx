import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Icon from '../components/shared/Icon';
import AvatarSVG, { parseSvgAvatarId } from '../components/shared/AvatarSVG';
import useAuthStore from '../store/authStore';

const API = import.meta.env.VITE_API_URL || 'https://carbonfootprint-production-636f.up.railway.app/api';

/* ── Suggestion chips shown when chat is empty ─────────────── */
const SUGGESTIONS = [
  { icon: '🌡️', text: 'What is climate change?' },
  { icon: '💨', text: 'How to reduce my carbon footprint?' },
  { icon: '🌊', text: 'What is ocean acidification?' },
  { icon: '🌳', text: 'Why is deforestation harmful?' },
  { icon: '⚡', text: 'Benefits of solar energy in India?' },
  { icon: '🏭', text: 'What causes air pollution in Delhi?' },
  { icon: '♻️', text: 'How does recycling help the planet?' },
  { icon: '🦋', text: 'What is biodiversity and why it matters?' },
];

/* ── Format timestamp ───────────────────────────────────────── */
const fmtTime = (d) => {
  const date = new Date(d);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

function renderFormattedText(text) {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} style={{ fontWeight: 700, color: '#047857' }}>
          {part}
        </strong>
      );
    }
    return part;
  });
}

/* ── Render AI message with basic formatting ─────────────────── */
function AiText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: '6px' }} />;

        // Section headings (ALL CAPS line)
        if (/^[A-Z][A-Z\s&/,–—:]{4,}$/.test(trimmed)) {
          return (
            <div key={i} style={{ fontWeight: 800, fontSize: '0.82rem', color: '#065F46', marginTop: '8px', letterSpacing: '0.3px' }}>
              {renderFormattedText(trimmed)}
            </div>
          );
        }
        // Bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', lineHeight: 1.55 }}>
              <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>•</span>
              <span>{renderFormattedText(content)}</span>
            </div>
          );
        }
        // Tip line
        if (trimmed.startsWith('💡 Tip:')) {
          return (
            <div key={i} style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.85rem', color: '#065F46', lineHeight: 1.5, fontWeight: 500 }}>
              {renderFormattedText(trimmed)}
            </div>
          );
        }
        return (
          <p key={i} style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/* ── Typing animation dots ───────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', padding: '6px 0', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ── EcoGuide Avatar SVG ─────────────────────────────────────── */
function EcoGuideAvatar({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(16,185,129,0.4)', boxShadow: '0 0 0 3px rgba(16,185,129,0.12)' }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8FDF5" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f3fbf7" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>
          <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="leafGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bgGrad)" stroke="#10b981" strokeWidth="2.5" />
        <path d="M25 88 C 25 72, 75 72, 75 88 Z" fill="url(#metalGrad)" stroke="#A7F3D0" strokeWidth="1" />
        <rect x="44" y="68" width="12" height="6" rx="2" fill="#94A3B8" />
        <rect x="28" y="32" width="44" height="38" rx="19" fill="url(#metalGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="33" y="37" width="34" height="24" rx="10" fill="url(#visorGrad)" />
        <path d="M33 45 C33 40, 67 40, 67 45 C67 41, 33 41, 33 45 Z" fill="rgba(255, 255, 255, 0.2)" />
        <path d="M37 39 Q 45 42, 63 39" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="43" cy="48" r="3.5" fill="#FFFFFF" filter="url(#eyeGlow)" />
        <circle cx="57" cy="48" r="3.5" fill="#FFFFFF" filter="url(#eyeGlow)" />
        <circle cx="44.5" cy="46.5" r="1" fill="#0EA5E9" />
        <circle cx="58.5" cy="46.5" r="1" fill="#0EA5E9" />
        <path d="M46 54 Q 50 57, 54 54" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#eyeGlow)" />
        <circle cx="37" cy="53" r="1.5" fill="#F43F5E" opacity="0.7" filter="url(#eyeGlow)" />
        <circle cx="63" cy="53" r="1.5" fill="#F43F5E" opacity="0.7" filter="url(#eyeGlow)" />
        <path d="M50 32 Q 50 21, 46 14" stroke="#64748B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M50 32 Q 50 21, 54 14" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M46 14 C 36 10, 32 17, 46 14 Z" fill="url(#leafGrad)" />
        <path d="M54 14 C 64 10, 68 17, 54 14 Z" fill="url(#leafGrad)" />
        <rect x="42" y="70" width="16" height="8" rx="4" fill="#10b981" />
        <text x="50" y="76.5" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">AI</text>
      </svg>
    </div>
  );
}

/* ── Main EcoGuide Chat Page ─────────────────────────────────── */
export default function News() {
  const { user, isAuthenticated, getToken } = useAuthStore();
  const token = getToken(); // validated real JWT or null
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [clearing, setClearing]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  /* Load history from MongoDB on mount */
  useEffect(() => {
    fetch(`${API}/env-chat`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => {
        if (d.success) setMessages(d.messages || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Auto-scroll to bottom whenever messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || isTyping) return;

    setInput('');
    // Optimistically add user message
    const tempUser = { role: 'user', content: q, createdAt: new Date().toISOString(), _id: `tmp-${Date.now()}` };
    setMessages(prev => [...prev, tempUser]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/env-chat`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev.filter(m => m._id !== tempUser._id),
          data.userMessage,
          data.aiMessage,
        ]);
      } else {
        toast.error(data.message || 'Failed to send message. Please try again.');
        setMessages(prev => prev.filter(m => m._id !== tempUser._id));
      }
    } catch {
      toast.error('Network error. Please check your connection.');
      setMessages(prev => prev.filter(m => m._id !== tempUser._id));
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isTyping, isAuthenticated, token]);

  const handleClear = async () => {
    if (!window.confirm('Clear all chat history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await fetch(`${API}/env-chat`, { method: 'DELETE', headers: authHeaders });
      setMessages([]);
      toast.success('🌿 Chat history cleared');
    } catch {
      toast.error('Failed to clear history');
    } finally {
      setClearing(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="chat-page-container">

      {/* ── Top Header ──────────────────────────────────────── */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <EcoGuideAvatar size={44} />
          <div>
            <h1 style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.1rem', margin: 0, lineHeight: 1.2 }}>
              EcoGuide <span style={{ fontSize: '0.65rem', background: 'rgba(110,231,183,0.25)', padding: '2px 8px', borderRadius: '12px', color: '#6EE7B7', fontWeight: 600, letterSpacing: '0.5px', marginLeft: '6px' }}>AI</span>
            </h1>
            <p className="chat-header-desc">
              Your Environmental Knowledge Assistant
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              disabled={clearing}
              style={{ padding: '7px 14px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#A7F3D0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Icon name="trash-2" size={13} /> {clearing ? 'Clearing...' : 'Clear History'}
            </motion.button>
          )}
          <div style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ color: '#6EE7B7', fontSize: '0.74rem', fontWeight: 700 }}>Online</span>
          </div>
        </div>
      </div>

      {/* ── Messages Area ────────────────────────────────────── */}
      <div className="chat-messages-container">
        <div className="chat-messages-inner">

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                  {i % 2 !== 0 && <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />}
                  <div className="skeleton" style={{ height: '52px', width: `${40 + i * 15}%`, borderRadius: '14px' }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {isEmpty && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 16px' }}>

              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{ marginBottom: '20px' }}>
                <EcoGuideAvatar size={80} />
              </motion.div>

              <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: '#022c22', marginBottom: '8px', letterSpacing: '-0.025em', fontFamily: 'var(--font-heading)' }}>Ask EcoGuide Anything!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '480px', lineHeight: 1.6, marginBottom: '28px', fontFamily: 'var(--font-body)' }}>
                I'm your dedicated environmental AI assistant. Ask me about climate change, carbon footprint, pollution, renewable energy, biodiversity, or any eco topic!
              </p>

              {/* Suggestion chips */}
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={i}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.03, y: -1, background: '#ffffff', borderColor: 'rgba(16,185,129,0.4)', boxShadow: '0 6px 16px rgba(6,78,59,0.08)' }} whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(s.text)}
                    style={{ padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#022c22', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(6,78,59,0.03)', transition: 'all 0.25s ease', width: '100%', justifyContent: 'flex-start' }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    <span style={{ textAlign: 'left', lineHeight: 1.25 }}>{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message bubbles */}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div key={msg._id || i}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                >
                  {/* AI avatar on left */}
                  {!isUser && <EcoGuideAvatar size={34} />}

                  <div className="chat-bubble-wrapper" style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    {/* Sender label */}
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', paddingLeft: isUser ? 0 : '4px', paddingRight: isUser ? '4px' : 0 }}>
                      {isUser ? (user?.name || 'You') : 'EcoGuide'} · {fmtTime(msg.createdAt)}
                    </span>

                    {/* Bubble */}
                    <motion.div
                      initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                      style={{
                        padding: '13px 18px',
                        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                        background: isUser
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : '#FFFFFF',
                        color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                        boxShadow: isUser
                          ? '0 4px 14px rgba(16,185,129,0.3)'
                          : '0 4px 20px -2px rgba(6, 78, 59, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        border: isUser ? 'none' : '1px solid rgba(16,185,129,0.08)',
                      }}
                    >
                      {isUser
                        ? <p style={{ margin: 0 }}>{msg.content}</p>
                        : <AiText text={msg.content} />
                      }
                    </motion.div>
                  </div>

                  {/* User avatar on right */}
                  {isUser && (
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(16,185,129,0.4)', background: '#ECFDF5' }}>
                      {user?.avatar && parseSvgAvatarId(user.avatar) ? (
                        <AvatarSVG svgId={parseSvgAvatarId(user.avatar)} />
                      ) : user?.avatar ? (
                        <img src={user.avatar} alt={user.name || 'Your avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#10B981', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem' }}>
                          {(user?.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <EcoGuideAvatar size={34} />
              <div style={{ padding: '10px 16px', borderRadius: '4px 18px 18px 18px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <TypingDots />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input Bar ────────────────────────────────────────── */}
      <div className="chat-input-bar">
        <div className="chat-input-inner">
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask EcoGuide about climate, pollution, carbon footprint..."
              disabled={isTyping}
              rows={1}
              style={{
                width: '100%', padding: '13px 18px', borderRadius: '14px',
                border: '1.5px solid rgba(0,0,0,0.1)', fontSize: '0.92rem',
                outline: 'none', resize: 'none', overflowY: 'auto',
                fontFamily: 'inherit', lineHeight: 1.5, color: 'var(--text-primary)',
                background: isAuthenticated ? '#FFFFFF' : '#F8FAFC',
                boxSizing: 'border-box',
                maxHeight: '120px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.boxShadow = 'none'; }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <motion.button
            whileHover={{ scale: input.trim() ? 1.07 : 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            style={{
              width: '48px', height: '48px', borderRadius: '14px', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
              background: input.trim() ? 'linear-gradient(135deg, #10B981, #059669)' : '#E2E8F0',
              color: input.trim() ? '#FFFFFF' : '#94A3B8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
              boxShadow: input.trim() ? '0 4px 12px rgba(16,185,129,0.35)' : 'none',
            }}
          >
            {isTyping
              ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Icon name="loader" size={20} /></motion.div>
              : <Icon name="send" size={20} />
            }
          </motion.button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          EcoGuide only answers environmental topics • Chat saved to your account • Press Enter to send
        </p>
      </div>
    </div>
  );
}
