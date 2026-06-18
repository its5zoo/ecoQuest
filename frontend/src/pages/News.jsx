import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Icon from '../components/shared/Icon';
import AvatarSVG, { parseSvgAvatarId } from '../components/shared/AvatarSVG';
import useAuthStore from '../store/authStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
        <circle cx="50" cy="50" r="50" fill="#ECFDF5" />
        {/* Body */}
        <ellipse cx="50" cy="85" rx="28" ry="18" fill="#065F46" />
        {/* Head */}
        <ellipse cx="50" cy="46" rx="20" ry="22" fill="#D1FAE5" />
        {/* Leaf antenna */}
        <path d="M50 24 C44 14 36 12 38 20 C40 28 50 26 50 24Z" fill="#10B981" />
        <path d="M50 24 C56 14 64 12 62 20 C60 28 50 26 50 24Z" fill="#059669" />
        <line x1="50" y1="24" x2="50" y2="30" stroke="#065F46" strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="42" cy="46" r="4" fill="#065F46" />
        <circle cx="58" cy="46" r="4" fill="#065F46" />
        <circle cx="43.5" cy="44.5" r="1.5" fill="white" />
        <circle cx="59.5" cy="44.5" r="1.5" fill="white" />
        {/* Smile */}
        <path d="M42 55 Q50 62 58 55" stroke="#065F46" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* AI badge */}
        <rect x="36" y="70" width="28" height="12" rx="6" fill="#10B981" />
        <text x="50" y="79.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="800" fontFamily="sans-serif">AI</text>
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

              <h2 style={{ fontWeight: 900, fontSize: '1.3rem', color: '#065F46', marginBottom: '8px' }}>Ask EcoGuide Anything!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '400px', lineHeight: 1.6, marginBottom: '28px' }}>
                I'm your dedicated environmental AI. Ask me about climate change, carbon footprint, pollution, renewable energy, biodiversity, or any eco topic!
              </p>

              {/* Suggestion chips */}
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={i}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(s.text)}
                    style={{ padding: '10px 14px', borderRadius: '16px', border: '1.5px solid rgba(16,185,129,0.2)', background: '#FFFFFF', color: '#065F46', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(6,78,59,0.04)', transition: 'all 0.2s', width: '100%', justifyContent: 'flex-start' }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    <span style={{ textAlign: 'left', lineHeight: 1.2 }}>{s.text}</span>
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
