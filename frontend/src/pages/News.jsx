import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Icon from '../components/shared/Icon';
import AvatarSVG from '../components/shared/AvatarSVG';
import { parseSvgAvatarId } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import { getApiBase } from '../services/apiClient';

const API = getApiBase();

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
  if (!d) return '';
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
            <div key={i} style={{ fontWeight: 800, fontSize: '0.92rem', color: '#065F46', marginTop: '12px', marginBottom: '6px', letterSpacing: '0.3px' }}>
              {renderFormattedText(trimmed)}
            </div>
          );
        }
        // Bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', lineHeight: 1.55, margin: '3px 0' }}>
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
          <p key={i} style={{ margin: '4px 0', fontSize: '0.88rem', lineHeight: 1.6 }}>
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
          <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E6FFFA" />
            <stop offset="100%" stopColor="#B2F5EA" />
          </radialGradient>
          <linearGradient id="canopyBack" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="canopyFront" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="canopyHighlight" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="50%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#skyGrad)" stroke="#319795" strokeWidth="2.5" />
        <path d="M42 90 L44 60 C44 55, 56 55, 56 60 L58 90 Z" fill="url(#trunkGrad)" />
        <path d="M42 90 C34 90, 32 85, 42 85 C42 85, 58 85, 58 85 C68 85, 66 90, 58 90 Z" fill="#78350F" />
        <path d="M44 65 Q34 60, 36 54 Q38 52, 43 58" stroke="#92400E" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M56 65 Q66 60, 64 54 Q62 52, 57 58" stroke="#92400E" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="35" cy="40" r="16" fill="url(#canopyBack)" />
        <circle cx="65" cy="40" r="16" fill="url(#canopyBack)" />
        <circle cx="50" cy="30" r="18" fill="url(#canopyBack)" />
        <circle cx="36" cy="42" r="13" fill="url(#canopyFront)" />
        <circle cx="64" cy="42" r="13" fill="url(#canopyFront)" />
        <circle cx="50" cy="33" r="15" fill="url(#canopyFront)" />
        <circle cx="42" cy="31" r="9" fill="url(#canopyHighlight)" />
        <circle cx="58" cy="31" r="9" fill="url(#canopyHighlight)" />
        <circle cx="50" cy="25" r="10" fill="url(#canopyHighlight)" />
        <circle cx="42" cy="42" r="4.5" fill="#0F172A" />
        <circle cx="58" cy="42" r="4.5" fill="#0F172A" />
        <circle cx="43.5" cy="40.5" r="1.5" fill="#FFFFFF" />
        <circle cx="59.5" cy="40.5" r="1.5" fill="#FFFFFF" />
        <circle cx="41" cy="43.5" r="0.8" fill="#FFFFFF" />
        <circle cx="57" cy="43.5" r="0.8" fill="#FFFFFF" />
        <path d="M46 47 Q50 51, 54 47" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="37" cy="46" r="2" fill="#F43F5E" opacity="0.6" filter="url(#softGlow)" />
        <circle cx="63" cy="46" r="2" fill="#F43F5E" opacity="0.6" filter="url(#softGlow)" />
        <circle cx="28" cy="35" r="2" fill="#FCD34D" filter="url(#softGlow)" />
        <path d="M28 32 C26 32, 26 38, 28 38 C30 38, 30 32, 28 32 Z" fill="#FB7185" />
        <path d="M25 35 C25 33, 31 33, 31 35 C31 37, 25 37, 25 35 Z" fill="#FB7185" />
        <circle cx="72" cy="35" r="2" fill="#FCD34D" filter="url(#softGlow)" />
        <path d="M72 32 C70 32, 70 38, 72 38 C74 38, 74 32, 72 32 Z" fill="#FB7185" />
        <path d="M69 35 C69 33, 75 33, 75 35 C75 37, 69 37, 69 35 Z" fill="#FB7185" />
        <path d="M57 76 C59 72, 65 72, 63 76 Z" fill="#4ADE80" />
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
  const [selectedUserMsgId, setSelectedUserMsgId] = useState(null);
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

  /* Synchronize selection to the latest user message when list updates */
  useEffect(() => {
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length > 0) {
      const hasSelected = userMsgs.some(m => m._id === selectedUserMsgId);
      if (!selectedUserMsgId || !hasSelected) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedUserMsgId(userMsgs[userMsgs.length - 1]._id);
      }
    } else {
      setSelectedUserMsgId(null);
    }
  }, [messages, selectedUserMsgId]);

  const userMessages = useMemo(() => messages.filter(m => m.role === 'user'), [messages]);

  const activeAiMsg = useMemo(() => {
    const selectedUserIndex = selectedUserMsgId ? messages.findIndex(m => m._id === selectedUserMsgId) : -1;
    return selectedUserIndex !== -1 && selectedUserIndex < messages.length - 1
      ? messages[selectedUserIndex + 1]
      : null;
  }, [messages, selectedUserMsgId]);

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || isTyping) return;

    setInput('');
    // Optimistically add user message
    const tempUser = { role: 'user', content: q, createdAt: new Date().toISOString(), _id: `tmp-${Date.now()}` };
    setMessages(prev => [...prev, tempUser]);
    setSelectedUserMsgId(tempUser._id);
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
        setSelectedUserMsgId(data.userMessage._id);
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
      setSelectedUserMsgId(null);
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
      <div className="chat-split-grid">
        
        {/* Left Column: User Panel */}
        <div className="chat-user-panel">
          <div className="chat-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(16,185,129,0.2)' }}>
                {user?.avatar && parseSvgAvatarId(user.avatar) ? (
                  <AvatarSVG svgId={parseSvgAvatarId(user.avatar)} />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#10B981', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem' }}>
                    {(user?.name || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="chat-panel-title">You</span>
            </div>
            
            {messages.length > 0 && (
              <button onClick={handleClear} disabled={clearing} className="chat-action-btn">
                <Icon name="trash-2" size={13} /> {clearing ? 'Clearing...' : 'Clear History'}
              </button>
            )}
          </div>

          <div className="chat-user-questions-list">
            {loading && <div className="chat-placeholder-state"><p>Loading conversation history...</p></div>}

            {isEmpty && !loading && (
              <div className="chat-welcome-state">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} style={{ marginBottom: '16px' }}>
                  <EcoGuideAvatar size={60} />
                </motion.div>
                <h3>Ask EcoGuide!</h3>
                <p>Dedicated environmental AI assistant.</p>
                <div className="suggestions-vertical">
                  {SUGGESTIONS.slice(0, 4).map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s.text)} className="suggestion-item-btn">
                      <span>{s.icon}</span> <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {userMessages.map((msg, index) => {
              const isSelected = msg._id === selectedUserMsgId;
              return (
                <div
                  key={msg._id || index}
                  onClick={() => setSelectedUserMsgId(msg._id)}
                  className={`chat-question-item ${isSelected ? 'active-question' : ''}`}
                >
                  <p className="chat-question-text">{msg.content}</p>
                  <div className="chat-question-meta">
                    <span>{fmtTime(msg.createdAt)}</span>
                    <Icon name="check-check" size={12} color="#10B981" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-user-input-area">
            <div className="chat-input-wrapper">
              <Icon name="leaf" size={18} color="var(--primary)" style={{ marginLeft: '10px', opacity: 0.65 }} />
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask EcoGuide about climate, pollution..."
                disabled={isTyping}
                rows={1}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || isTyping} className="chat-send-btn">
                {isTyping ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Icon name="loader" size={16} /></motion.div> : <Icon name="send" size={16} />}
              </button>
            </div>
            <p className="chat-input-footnote">
              EcoGuide only answers environmental topics • Chat saved to your account • Press Enter to send
            </p>
          </div>
        </div>

        {/* Right Column: AI Panel */}
        <div className="chat-ai-panel">
          <div className="chat-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <EcoGuideAvatar size={28} />
              <span className="chat-panel-title">EcoGuide AI</span>
            </div>
            <div className="chat-online-badge">
              <span className="dot" />
              <span>Online</span>
            </div>
          </div>

          <div className="chat-ai-answer-area">
            {isTyping && !activeAiMsg && (
              <div className="chat-typing-container">
                <p className="chat-typing-text">EcoGuide is preparing your response...</p>
                <TypingDots />
              </div>
            )}

            {activeAiMsg ? (
              <div className="chat-ai-content">
                <AiText text={activeAiMsg.content} />
              </div>
            ) : !isTyping ? (
              <div className="chat-placeholder-state">
                <Icon name="message-square" size={48} color="var(--primary)" style={{ opacity: 0.25, marginBottom: '16px' }} />
                <p>Select a question on the left or type a new one to view responses.</p>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {activeAiMsg && (
            <div className="chat-ai-actions">
              <button onClick={() => {
                navigator.clipboard.writeText(activeAiMsg.content);
                toast.success('📋 Copied to clipboard!');
              }} className="chat-icon-btn" title="Copy response">
                <Icon name="copy" size={15} />
              </button>
              <button className="chat-icon-btn" title="Thumbs Up"><Icon name="thumbs-up" size={15} /></button>
              <button className="chat-icon-btn" title="Thumbs Down"><Icon name="thumbs-down" size={15} /></button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
