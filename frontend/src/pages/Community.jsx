import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Icon from '../components/shared/Icon';
import AvatarSVG from '../components/shared/AvatarSVG';
import { parseSvgAvatarId, timeAgo } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import { fetchPosts, createPost } from '../services/socialService';
import { fetchLeaderboard, mapLeaderboardEntry } from '../services/leaderboardService';

/* ── Avatar helper (handles both SVG presets and img URLs) ─── */
function UserAvatar({ avatar, name, size = 44 }) {
  const svgId = parseSvgAvatarId(avatar);
  const commonRing = {
    width: size, height: size, borderRadius: '50%',
    flexShrink: 0, overflow: 'hidden',
    border: '2px solid rgba(0,200,150,0.25)',
    background: 'rgba(0,0,0,0.04)',
  };
  if (svgId) {
    return (
      <div style={commonRing}>
        <AvatarSVG svgId={svgId} />
      </div>
    );
  }
  return (
    <img
      src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'Guest'}`}
      alt={name || 'avatar'}
      style={{ ...commonRing, objectFit: 'cover' }}
    />
  );
}

const PAGE_SIZE = 20;

const SCOPE_META = {
  District: { icon: 'map-pin', label: 'Your District', desc: 'Top eco-warriors in your district', color: '#3B82F6' },
  State:    { icon: 'map',     label: 'Your State',    desc: 'Leaders across your state',        color: '#8B5CF6' },
  India:    { icon: 'flag',    label: 'All India',     desc: 'National eco champions',            color: '#F59E0B' },
};

const TAB_VARIANTS = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
};

/* ── Skeleton Row ───────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 20px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{ width: 36, height: 20, borderRadius: 6, background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '40%', height: 13, borderRadius: 4, background: 'rgba(0,0,0,0.07)' }} />
        <div style={{ width: '60%', height: 10, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }} />
      </div>
      <div style={{ width: 70, height: 18, borderRadius: 6, background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />
    </div>
  );
}

/* ── Single leaderboard row ─────────────────────────────────── */
function LeaderboardRow({ user, index, isSticky = false, totalRows }) {
  const medals = ['🥇', '🥈', '🥉'];
  const rankLabel = user.rank <= 3 ? medals[user.rank - 1] : `#${user.rank}`;

  return (
    <motion.div
      key={isSticky ? 'sticky-me' : user.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(10px, 2vw, 16px)',
        padding: 'clamp(10px, 2vw, 16px) clamp(12px, 3vw, 24px)',
        borderBottom: (!isSticky && index < totalRows - 1) ? '1px solid rgba(0,0,0,0.05)' : 'none',
        background: user.isMe
          ? isSticky ? '#F0FDF4' : 'rgba(0,200,150,0.05)'
          : 'transparent',
        border:       isSticky ? '2px solid var(--primary)' : 'none',
        borderRadius: isSticky ? '14px' : '0',
        marginTop:    isSticky ? '16px' : '0',
        boxShadow:    isSticky ? '0 4px 18px rgba(0,200,150,0.10)' : 'none',
        flexWrap: 'wrap',
        rowGap: 8,
      }}
    >
      {/* Rank */}
      <div style={{
        minWidth: 36, textAlign: 'center', flexShrink: 0,
        fontWeight: 800,
        color: user.rank === 1 ? '#F59E0B'
             : user.rank === 2 ? '#94A3B8'
             : user.rank === 3 ? '#B45309'
             : 'var(--text-muted)',
        fontSize: user.rank <= 3 ? '1.2rem' : '1rem',
      }}>
        {rankLabel}
      </div>

      {/* Avatar */}
      <UserAvatar avatar={user.avatar} name={user.name} size={44} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{
          fontWeight: 700,
          color: user.isMe ? 'var(--primary)' : 'var(--text-primary)',
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            {user.name}
          </span>
          {user.isMe && (
            <span style={{
              fontSize: '0.6rem', background: 'var(--primary)', color: '#FFF',
              padding: '2px 7px', borderRadius: 4, letterSpacing: '1px', flexShrink: 0,
            }}>YOU</span>
          )}
          {isSticky && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>📌 Pinned</span>
          )}
        </div>

        <div style={{
          fontSize: '0.78rem', color: 'var(--text-muted)',
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="star" size={10} color="#F59E0B" /> Lv {user.level}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="leaf" size={10} color="#00C896" /> {user.carbonSaved} kg CO₂
          </span>
          {user.district && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 7px', borderRadius: 20,
              background: 'rgba(59,130,246,0.07)',
              border: '1px solid rgba(59,130,246,0.15)',
              color: '#3B82F6', fontWeight: 600,
            }}>
              📍 {user.district}
            </span>
          )}
        </div>
      </div>

      {/* XP score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}>
          {Number(user.totalXP).toLocaleString()} XP
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Score</div>
      </div>
    </motion.div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function Community() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Leaderboard');
  const [scope,     setScope]     = useState('District');
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);

  // Real leaderboard data from backend
  const [leaderboard,    setLeaderboard]    = useState([]);
  const [myEntry,        setMyEntry]        = useState(null);
  const [totalCount,     setTotalCount]     = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);

  const { user, isAuthenticated, getToken, logout } = useAuthStore();
  const token = getToken(); // only real JWTs; null if stale/mock

  // Community Feed state
  const [feedScope,       setFeedScope]       = useState('State');
  const [posts,           setPosts]           = useState([]);
  const [newPostContent,  setNewPostContent]  = useState('');
  const [posting,         setPosting]         = useState(false);
  const [loadingPosts,    setLoadingPosts]    = useState(false);
  const [moderationError, setModerationError] = useState(null);

  const totalPages  = Math.ceil(totalCount / PAGE_SIZE);
  const showStickyMe = myEntry && !leaderboard.some(u => u.isMe);

  /* ── Load Leaderboard from backend ── */
  const loadLeaderboard = useCallback(async () => {
    if (activeTab !== 'Leaderboard') return;

    if (!isAuthenticated || !token) {
      // User has no valid session — show login prompt (not an error)
      setLeaderboard([]);
      setMyEntry(null);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setSessionExpired(false);
    try {
      const region = scope === 'District' ? (user?.district || '')
                   : scope === 'State'    ? (user?.state    || '')
                   : '';
      const data = await fetchLeaderboard({ scope, region, page, limit: PAGE_SIZE, token });

      const mapped = (data.leaderboard || []).map(e => mapLeaderboardEntry(e, user?.id));
      setLeaderboard(mapped);
      setTotalCount(data.total || 0);
      setMyEntry(data.me ? mapLeaderboardEntry(data.me, user?.id) : null);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      if (err.status === 401) {
        // Token is invalid / expired — clear session, show re-login prompt
        setSessionExpired(true);
        logout();
      } else {
        toast.error('Failed to load leaderboard. Please try again.');
      }
      setLeaderboard([]);
      setMyEntry(null);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, scope, page, token, isAuthenticated, user, logout]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadLeaderboard();
    });
  }, [loadLeaderboard]);

  const handleScopeChange = (s) => {
    if (s === scope) return;
    setPage(1);
    setScope(s);
  };

  /* ── Community Feed ── */
  useEffect(() => {
    if (activeTab !== 'Community Feed' || !isAuthenticated) return;
    const load = async () => {
      setLoadingPosts(true);
      try {
        const list = await fetchPosts(feedScope, user?.district, user?.state);
        setPosts(list);
      } catch (err) {
        console.error(err);
        toast.error('❌ Failed to load community posts');
      } finally {
        setLoadingPosts(false);
      }
    };
    Promise.resolve().then(() => {
      load();
    });
  }, [activeTab, feedScope, isAuthenticated, user]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setPosting(true);
    setModerationError(null);
    const res = await createPost(newPostContent.trim(), feedScope);
    setPosting(false);
    if (res.success) {
      setNewPostContent('');
      setPosts(prev => [res.post, ...prev]);
      toast.success('🌿 Post published successfully!');
    } else {
      if (res.isModerationFailure) setModerationError(res.message);
      else toast.error(res.message || '❌ Failed to publish post');
    }
  };

  /* ── Render ── */
  return (
    <div className="container section-padding" style={{ paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 className="text-display" style={{ marginBottom: 16 }}>
          Community <span className="gradient-text">Hub</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', fontSize: '1.05rem' }}>
          Connect, compete, and collaborate with eco-warriors to maximise our collective impact.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 40, flexWrap: 'wrap' }}>
        {['Leaderboard', 'Community Feed'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '11px clamp(18px, 4vw, 36px)',
              borderRadius: 30,
              background: activeTab === tab ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
              color:      activeTab === tab ? '#FFF' : 'var(--text-muted)',
              fontWeight: 700, border: 'none', cursor: 'pointer',
              transition: 'all 0.25s',
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
            }}
          >
            {tab === 'Leaderboard' ? '🏆 ' : '🌿 '}{tab}
          </button>
        ))}
      </div>

      {/* ════ LEADERBOARD TAB ════ */}
      {activeTab === 'Leaderboard' && (!isAuthenticated || sessionExpired) && (
        <div className="glass-card" style={{
          minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20, textAlign: 'center', padding: '40px 20px',
        }}>
          <Icon name="lock" size={64} color="#00C896" />
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem' }}>
            {sessionExpired ? '🔒 Session Expired' : 'Login to View Leaderboard'}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
            {sessionExpired
              ? 'Your session has expired. Please log in again to see real-time rankings.'
              : 'Sign in to see real-time rankings across your district, state, and nationally.'}
          </p>
          <motion.button className="btn-primary" onClick={() => navigate('/login?redirect=%2Fcommunity')} whileHover={{ scale: 1.05 }}>
            {sessionExpired ? '🔑 Log In Again' : 'Login'}
          </motion.button>
        </div>
      )}

      {activeTab === 'Leaderboard' && isAuthenticated && !sessionExpired && (
        <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible">

          {/* Scope selector */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(SCOPE_META).map(([s, meta]) => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleScopeChange(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px', borderRadius: 10,
                    background: scope === s ? `${meta.color}12` : 'transparent',
                    color:      scope === s ? meta.color : 'var(--text-muted)',
                    border:     `1.5px solid ${scope === s ? meta.color : 'rgba(0,0,0,0.1)'}`,
                    cursor: 'pointer', fontWeight: scope === s ? 700 : 500,
                    fontSize: '0.86rem', transition: 'all 0.2s',
                  }}
                >
                  <Icon name={meta.icon} size={13} />
                  <span>{meta.label}</span>
                </motion.button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {totalCount} participants
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {SCOPE_META[scope]?.desc}
              </span>
            </div>
          </div>

          {/* Leaderboard table */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-card" style={{ padding: 0, overflow: 'hidden' }}
              >
                {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
              </motion.div>
            ) : leaderboard.length === 0 && !myEntry ? (
              /* ── Empty state — happens only if scope has NO users at all ── */
              <motion.div
                key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-card"
                style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
              >
                <div style={{ fontSize: '3rem' }}>🌱</div>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Be the First Champion!</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
                  No one has logged activities in this {scope === 'India' ? 'national' : scope.toLowerCase()} scope yet.
                  Start tracking your eco-activities to lead the board!
                </p>
                <motion.button
                  className="btn-primary"
                  onClick={() => navigate('/tracker')}
                  whileHover={{ scale: 1.05 }}
                >
                  🌿 Log an Activity
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key={`${scope}-${page}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="glass-card"
                style={{ padding: 0 }}
              >
                {leaderboard.map((u, i) => (
                  <LeaderboardRow key={u.id} user={u} index={i} totalRows={leaderboard.length} />
                ))}

                {/* Sticky pinned "You" row when you're outside the current page */}
                {showStickyMe && (
                  <LeaderboardRow user={myEntry} index={0} isSticky totalRows={1} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div style={{ marginTop: 24 }}>
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500 }}>
                Showing{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
                </strong>
                {' '}of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong> eco-warriors
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <PagBtn label="«" onClick={() => setPage(1)}             disabled={page === 1} />
                <PagBtn label="‹ Prev" onClick={() => setPage(p => p-1)} disabled={page === 1} />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                  const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                  if (!show) return null;
                  return (
                    <motion.button key={p} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(p)}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: `1.5px solid ${p === page ? 'var(--primary)' : 'rgba(0,0,0,0.1)'}`,
                        background: p === page ? 'var(--primary)' : '#fff',
                        color:      p === page ? '#fff' : 'var(--text-muted)',
                        fontWeight: p === page ? 800 : 600, cursor: 'pointer', fontSize: '0.85rem',
                        boxShadow: p === page ? '0 4px 12px rgba(0,200,150,0.3)' : 'none',
                      }}
                    >{p}</motion.button>
                  );
                })}
                <PagBtn label="Next ›" onClick={() => setPage(p => p+1)} disabled={page === totalPages} />
                <PagBtn label="»"      onClick={() => setPage(totalPages)} disabled={page === totalPages} />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ════ COMMUNITY FEED TAB ════ */}
      {activeTab === 'Community Feed' && (
        <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!isAuthenticated ? (
            <div className="glass-card" style={{
              minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 20, textAlign: 'center', padding: '40px 20px',
            }}>
              <Icon name="lock" size={64} color="#00C896" />
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem' }}>Login to View Community Feed</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
                Share thoughts on eco actions and connect with warriors locally and nationally.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <motion.button className="btn-primary" onClick={() => navigate('/login?redirect=%2Fcommunity')} whileHover={{ scale: 1.05 }}>Login</motion.button>
                <motion.button className="btn-outline" onClick={() => navigate('/signup')} whileHover={{ scale: 1.05 }}>Sign Up Free</motion.button>
              </div>
            </div>
          ) : (
            <>
              {/* Feed scope selector */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { value: 'State',   label: `🗺️ ${user?.state || 'State'} Feed`, color: '#8B5CF6', icon: 'map'  },
                  { value: 'Country', label: '🇮🇳 National Feed',                  color: '#F59E0B', icon: 'flag' },
                ].map(s => (
                  <motion.button key={s.value}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setFeedScope(s.value); setModerationError(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 20px', borderRadius: 12,
                      background: feedScope === s.value ? `${s.color}12` : '#FFF',
                      color:      feedScope === s.value ? s.color : 'var(--text-muted)',
                      border:     `1.5px solid ${feedScope === s.value ? s.color : 'rgba(0,0,0,0.1)'}`,
                      cursor: 'pointer', fontWeight: feedScope === s.value ? 700 : 500,
                      fontSize: '0.88rem', transition: 'all 0.2s',
                    }}
                  >
                    <Icon name={s.icon} size={13} />{s.label}
                  </motion.button>
                ))}
              </div>

              {/* Post composer */}
              <div className="premium-card" style={{ padding: 24 }}>
                <h3 className="text-card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="message-square" size={18} color="var(--primary)" /> Share an Eco Thought
                </h3>
                <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    value={newPostContent}
                    onChange={e => { setNewPostContent(e.target.value); setModerationError(null); }}
                    placeholder={`What eco or social work action did you take in ${feedScope === 'State' ? user?.state : 'India'} today?`}
                    rows="3"
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 12,
                      background: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.08)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem',
                      resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
                    }}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ⚠️ No politics, memes, or off-topic chat. Audited by AI.
                    </span>
                    <motion.button type="submit" className="btn-primary"
                      disabled={posting || !newPostContent.trim()}
                      whileHover={{ scale: posting ? 1 : 1.03 }} whileTap={{ scale: posting ? 1 : 0.97 }}
                      style={{ padding: '8px 24px', opacity: posting || !newPostContent.trim() ? 0.6 : 1 }}
                    >
                      {posting ? 'Moderating…' : 'Post Thought'}
                    </motion.button>
                  </div>
                </form>

                {/* Moderation error */}
                <AnimatePresence>
                  {moderationError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: '#FEF2F2', border: '1px solid #FCA5A5',
                        borderRadius: 14, padding: '16px 20px', marginTop: 16,
                        display: 'flex', gap: 12, alignItems: 'flex-start', overflow: 'hidden',
                      }}
                    >
                      <div style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }}>
                        <Icon name="alert-triangle" size={20} />
                      </div>
                      <div>
                        <h4 style={{ color: '#991B1B', fontWeight: 700, fontSize: '0.92rem', margin: '0 0 4px' }}>Community Feed Violation</h4>
                        <p style={{ color: '#7F1D1D', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{moderationError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Posts list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loadingPosts ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.06)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ width: '25%', height: 12, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ width: '15%', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.03)' }} />
                        </div>
                      </div>
                      <div style={{ width: '90%', height: 10, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }} />
                      <div style={{ width: '60%', height: 10, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }} />
                    </div>
                  ))
                ) : posts.length === 0 ? (
                  <div className="glass-card" style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Icon name="message-square" size={48} color="var(--text-muted)" />
                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>No posts in this feed yet</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 340, margin: 0 }}>
                      Share your first eco action above!
                    </p>
                  </div>
                ) : posts.map(post => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="premium-card"
                    style={{ padding: 'clamp(16px, 3vw, 24px)', display: 'flex', gap: 16, flexDirection: 'column' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,200,150,0.2)', flexShrink: 0 }}>
                          {parseSvgAvatarId(post.userAvatar)
                            ? <AvatarSVG svgId={parseSvgAvatarId(post.userAvatar)} />
                            : <img src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName}`} alt={post.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{post.userName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                          borderRadius: 30, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                          background: post.scope === 'State' ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.08)',
                          color:      post.scope === 'State' ? '#8B5CF6' : '#F59E0B',
                          border:     `1px solid ${post.scope === 'State' ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        }}>
                          {post.scope === 'Country' ? 'National' : post.scope}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '3px 10px', borderRadius: 30, fontSize: '0.72rem', fontWeight: 700,
                          background: 'rgba(0,200,150,0.08)', color: 'var(--primary)',
                          border: '1px solid rgba(0,200,150,0.2)',
                        }}>
                          <Icon name="map-pin" size={10} color="var(--primary)" />
                          {post.scope === 'State' ? post.state : 'India'}
                        </span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ── Tiny Pagination Button ─────────────────────────────────── */
function PagBtn({ label, onClick, disabled }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 13px', borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.1)',
        background: disabled ? '#F8FAFC' : '#fff',
        color:      disabled ? '#CBD5E1' : 'var(--text-primary)',
        fontWeight: 600, cursor: disabled ? 'default' : 'pointer', fontSize: '0.82rem',
      }}
    >{label}</motion.button>
  );
}
