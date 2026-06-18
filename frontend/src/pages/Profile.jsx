import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import useTrackerStore from '../store/trackerStore';
import { formatCarbon, formatDate } from '../utils/helpers';
import { getLevel } from '../utils/carbonLogic';
import useSocialStore from '../store/socialStore';
import Icon from '../components/shared/Icon';
import VirtualForest from '../components/features/VirtualForest';
import ShareCard from '../components/features/ShareCard';
import AchievementModal from '../components/features/AchievementModal';
import AvatarPicker from '../components/features/AvatarPicker';
import AvatarSVG, { parseSvgAvatarId } from '../components/shared/AvatarSVG';
import { fetchMyRanks } from '../services/leaderboardService';

/* ── Tier config ─────────────────────────────────────────────── */
const TIERS = [
  { tier: 1, name: 'Seedling',  color: '#10B981', bg: '#ECFDF5', border: '#6EE7B7', glow: 'rgba(16,185,129,0.3)' },
  { tier: 2, name: 'Guardian',  color: '#06B6D4', bg: '#ECFEFF', border: '#67E8F9', glow: 'rgba(6,182,212,0.3)'  },
  { tier: 3, name: 'Champion',  color: '#8B5CF6', bg: '#F5F3FF', border: '#C4B5FD', glow: 'rgba(139,92,246,0.3)' },
  { tier: 4, name: 'Legend',    color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D', glow: 'rgba(245,158,11,0.3)' },
  { tier: 5, name: 'Apex',      color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5', glow: 'rgba(239,68,68,0.3)'  },
];

function getTierByXP(xp) {
  if (xp >= 5000) return TIERS[4];
  if (xp >= 3000) return TIERS[3];
  if (xp >= 1500) return TIERS[2];
  if (xp >= 500)  return TIERS[1];
  return TIERS[0];
}

function StatCard({ icon, value, label, color = 'var(--primary)' }) {
  return (
    <motion.div
      className="premium-card"
      style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}
      whileHover={{ scale: 1.04, y: -2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color }}>
        <Icon name={icon} size={26} />
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{label}</div>
    </motion.div>
  );
}

/* ── Badge Card (locked/unlocked) ───────────────────────────── */
function BadgeCard({ badge }) {
  const [hovered, setHovered] = useState(false);
  const tier = TIERS.find(t => t.tier === badge.tier) || TIERS[0];

  if (!badge.unlocked) {
    // Locked — show mystery card with hint on hover
    return (
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.04, y: -2 }}
        style={{
          padding: '18px 12px',
          borderRadius: '16px',
          background: '#F8FAFC',
          border: '1.5px dashed rgba(0,0,0,0.1)',
          textAlign: 'center',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '140px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {/* Mystery blob */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', marginBottom: '4px',
          filter: 'blur(0px)',
        }}>
          🔒
        </div>
        <AnimatePresence>
          {hovered ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,20,18,0.88)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${tier.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={badge.icon} size={18} color={tier.color} />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.3 }}>{badge.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.4 }}>
                🎯 {badge.hint}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${tier.color}30`, color: tier.color }}>
                {tier.name} Tier
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hover to reveal</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Unlocked badge
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -3 }}
      style={{
        padding: '18px 12px',
        borderRadius: '16px',
        background: `linear-gradient(145deg, ${tier.bg}, ${tier.bg}cc)`,
        border: `1.5px solid ${tier.border}`,
        textAlign: 'center',
        position: 'relative',
        boxShadow: `0 4px 20px ${tier.glow}`,
        minHeight: '140px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}
    >
      {/* Checkmark */}
      <div style={{
        position: 'absolute', top: '-7px', right: '-7px',
        background: tier.color, color: '#FFFFFF', borderRadius: '50%',
        width: '22px', height: '22px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 800, border: '2.5px solid #FFFFFF',
        boxShadow: `0 2px 8px ${tier.glow}`,
      }}>✓</div>

      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: `${tier.color}22`,
        border: `1.5px solid ${tier.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
      }}>
        <Icon name={badge.icon} size={26} color={tier.color} />
      </div>

      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{badge.name}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{badge.desc}</div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: `${tier.color}20`, color: tier.color, marginTop: '2px' }}>
        {tier.name} Tier
      </div>
    </motion.div>
  );
}

/* ── Level Journey Map ──────────────────────────────────────── */
function LevelJourney({ currentLevel, totalXP }) {
  const levels = [
    { level: 1,  name: 'Seedling',    minXP: 0,     emoji: '🌱' },
    { level: 2,  name: 'Sprout',      minXP: 200,   emoji: '🌿' },
    { level: 3,  name: 'Sapling',     minXP: 500,   emoji: '🌳' },
    { level: 4,  name: 'Young Tree',  minXP: 1000,  emoji: '🌲' },
    { level: 5,  name: 'Green Hero',  minXP: 2000,  emoji: '⚡' },
    { level: 6,  name: 'Eco Warrior', minXP: 3500,  emoji: '🛡️' },
    { level: 7,  name: 'Earth Guard', minXP: 5500,  emoji: '🌍' },
    { level: 8,  name: 'Planet Sage', minXP: 8000,  emoji: '🔮' },
    { level: 9,  name: 'Eco Legend',  minXP: 11000, emoji: '👑' },
    { level: 10, name: 'Climate Hero',minXP: 15000, emoji: '🏆' },
  ];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: '600px' }}>
        {levels.map((lvl, i) => {
          const isCompleted = lvl.level < currentLevel;
          const isCurrent   = lvl.level === currentLevel;
          const isLocked    = lvl.level > currentLevel;
          const tier = getTierByXP(lvl.minXP);

          return (
            <div key={lvl.level} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: '52px' }}>
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  style={{
                    width: isCurrent ? '46px' : '36px',
                    height: isCurrent ? '46px' : '36px',
                    borderRadius: '50%',
                    background: isCompleted ? tier.color : isCurrent ? `linear-gradient(135deg, ${tier.color}, ${tier.color}bb)` : '#E2E8F0',
                    border: isCurrent ? `3px solid ${tier.color}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isCurrent ? '1.2rem' : '0.9rem',
                    boxShadow: isCurrent ? `0 0 0 4px ${tier.glow}, 0 4px 16px ${tier.glow}` : 'none',
                    transition: 'all 0.3s',
                    cursor: 'default',
                  }}
                  title={`Level ${lvl.level}: ${lvl.name} (${lvl.minXP} XP)`}
                >
                  {isLocked ? <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>L{lvl.level}</span> : lvl.emoji}
                </motion.div>
                <span style={{ fontSize: '0.58rem', fontWeight: isCurrent ? 800 : 500, color: isCurrent ? tier.color : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                  {lvl.name}
                </span>
              </div>
              {i < levels.length - 1 && (
                <div style={{ flex: 1, height: '3px', background: isCompleted ? tier.color : '#E2E8F0', borderRadius: '2px', transition: 'background 0.3s', minWidth: '8px' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Profile Page ──────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser, token } = useAuthStore();
  const store = useTrackerStore();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', district: '', state: '', country: '' });
  const [myRanks, setMyRanks] = useState(null);

  useEffect(() => {
    const loadRanks = async () => {
      if (token && token !== 'mock-token-fallback') {
        try {
          const data = await fetchMyRanks(token);
          setMyRanks(data.ranks);
        } catch (err) {
          console.error('Failed to fetch genuine ranks:', err);
        }
      }
    };
    if (isAuthenticated) {
      loadRanks();
    }
  }, [isAuthenticated, token]);

  const handleOpenEditModal = () => {
    setEditForm({
      name: user.name || '',
      bio: user.bio || '',
      district: user.district || '',
      state: user.state || '',
      country: user.country || 'India'
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const res = await updateUser(editForm);
    if (res && res.success) {
      toast.success('🌿 Profile updated successfully!');
      setShowEditModal(false);
    } else {
      toast.error(res?.message || '❌ Failed to update profile details');
    }
  };

  const treeCost = store.forestLevel * 50;
  const handlePlantTree = () => {
    if (store.coins >= treeCost) {
      if (store.plantTree()) toast.success('🌱 You planted a new tree in your Virtual Forest!');
    } else {
      toast.warning(`You need ${treeCost - store.coins} more coins to plant a tree!`);
    }
  };

  const level    = getLevel(store.totalXP);
  const userTier = getTierByXP(store.totalXP);
  const weeklyData   = store.getWeeklyData();
  const allActivities = store.activities;
  const totalCarbon  = allActivities.reduce((s, a) => s + a.carbonKg, 0);

  const socialStore    = useSocialStore();
  const districtBoard  = socialStore.getLeaderboard('District', store.totalXP, user?.name, user?.avatar, user?.district);
  const stateBoard     = socialStore.getLeaderboard('State',    store.totalXP, user?.name, user?.avatar, user?.district);
  const nationalBoard  = socialStore.getLeaderboard('Country',  store.totalXP, user?.name, user?.avatar, user?.district);

  const getMyRank = (board) => board.find(u => u.id === 'me')?.rank ?? '-';
  const dynamicRanks = [
    { scope: 'District',  rank: myRanks?.district?.rank ?? getMyRank(districtBoard),  total: myRanks?.district?.total ?? 50,  icon: 'home',  color: '#06B6D4', emoji: '🏘️' },
    { scope: 'State',     rank: myRanks?.state?.rank ?? getMyRank(stateBoard),        total: myRanks?.state?.total ?? 500,    icon: 'map',   color: '#8B5CF6', emoji: '🗺️' },
    { scope: 'National',  rank: myRanks?.global?.rank ?? getMyRank(nationalBoard),     total: myRanks?.global?.total ?? 5000,  icon: 'flag',  color: '#F59E0B', emoji: '🇮🇳' },
  ];

  // Group badges by tier
  const badgesByTier = [1,2,3,4,5].map(t => ({
    tier: t,
    tierInfo: TIERS.find(ti => ti.tier === t),
    badges: store.badges.filter(b => b.tier === t),
  }));

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <Icon name="lock" size={64} color="#00C896" />
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem' }}>Login to View Your Profile</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '360px' }}>Track your eco-journey, earn badges, and see your impact.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button className="btn-primary" onClick={() => navigate('/login?redirect=%2Fprofile')} whileHover={{ scale: 1.05 }}>Login</motion.button>
          <motion.button className="btn-outline" onClick={() => navigate('/signup')} whileHover={{ scale: 1.05 }}>Sign Up Free</motion.button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4' }}>
      <AchievementModal />

      {/* Modals rendered via portals directly on document.body — bypasses CSS transform constraints */}
      {showAvatarPicker && createPortal(
        <AvatarPicker onClose={() => setShowAvatarPicker(false)} />,
        document.body
      )}

      {showEditModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,15,13,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setShowEditModal(false)}
        >
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: '#FFFFFF', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>✏️ Edit Profile Details</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>Update your name, bio and location settings</p>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'FULL NAME', key: 'name', type: 'text', required: true },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>{f.label}</label>
                  <input type={f.type} value={editForm[f.key]} onChange={e => setEditForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.08)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
                    required={f.required} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>BIO</label>
                <textarea value={editForm.bio} onChange={e => setEditForm(fm => ({ ...fm, bio: e.target.value }))} rows="3" placeholder="Tell us about your green goals..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.08)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['district','state'].map(k => (
                  <div key={k}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>{k.toUpperCase()}</label>
                    <input type="text" value={editForm[k]} onChange={e => setEditForm(fm => ({ ...fm, [k]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.08)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      required />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>COUNTRY</label>
                <input type="text" value={editForm.country} onChange={e => setEditForm(fm => ({ ...fm, country: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.08)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Gradient Hero Banner ─────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${userTier.color}22 0%, #FFFFFF 60%, ${userTier.color}0A 100%)`,
        borderBottom: `1px solid ${userTier.border}50`,
        padding: 'clamp(28px, 5vw, 48px) 0',
      }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '28px', justifyContent: 'space-between' }}
          >
            {/* Left — Avatar + Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Avatar with tier glow ring */}
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowAvatarPicker(true)}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    width: '108px', height: '108px', borderRadius: '50%',
                    border: `4px solid ${userTier.color}`,
                    boxShadow: `0 0 0 6px ${userTier.glow}, 0 8px 24px ${userTier.glow}`,
                    overflow: 'hidden',
                    background: '#FFFFFF',
                  }}
                >
                  {parseSvgAvatarId(user.avatar)
                    ? <AvatarSVG svgId={parseSvgAvatarId(user.avatar)} />
                    : <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  }
                </motion.div>
                {/* Edit overlay */}
                <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 700, flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>✏️</span><span>Change</span>
                </motion.div>
                {/* Level bubble */}
                <div style={{
                  position: 'absolute', bottom: '2px', right: '2px',
                  background: `linear-gradient(135deg, ${userTier.color}, ${userTier.color}cc)`,
                  color: 'white', borderRadius: '50%', width: '34px', height: '34px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 800, border: '3px solid #FFFFFF',
                  boxShadow: `0 2px 8px ${userTier.glow}`,
                }}>
                  {level.level}
                </div>
              </div>

              {/* User info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--text-primary)', margin: 0 }}>{user.name}</h2>
                  <button onClick={handleOpenEditModal}
                    style={{ background: `${userTier.color}18`, border: `1px solid ${userTier.color}35`, borderRadius: '20px', padding: '5px 13px', fontSize: '0.76rem', fontWeight: 600, color: userTier.color, display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <Icon name="pen-tool" size={11} /><span>Edit</span>
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: '8px' }}>{user.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <Icon name="map-pin" size={13} color={userTier.color} />
                  <span>{user.district || 'District'}, {user.state || 'State'}, {user.country || 'India'}</span>
                </div>
                {user.bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', margin: '0 0 10px', fontStyle: 'italic', maxWidth: '380px', lineHeight: 1.5 }}>"{user.bio}"</p>}

                {/* Badges row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, background: `${userTier.color}18`, border: `1px solid ${userTier.color}35`, color: userTier.color }}>
                    <Icon name="leaf" size={13} />{level.name} • {userTier.name} Tier
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309' }}>
                    <Icon name="flame" size={13} />{store.streak} Day Streak
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                    <Icon name="calendar" size={13} />Joined {formatDate(user.joinDate, { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — XP Progress */}
            <div style={{ minWidth: '220px', flex: '1 1 220px', background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: `1.5px solid ${userTier.border}`, boxShadow: `0 4px 20px ${userTier.glow}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Level Progress</span>
                <span style={{ fontSize: '0.82rem', color: userTier.color, fontWeight: 800 }}>{store.totalXP} / {level.maxXP} XP</span>
              </div>
              <div style={{ height: '10px', borderRadius: '8px', background: `${userTier.color}20`, overflow: 'hidden', marginBottom: '14px' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, ((store.totalXP - level.minXP) / (level.maxXP - level.minXP)) * 100))}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${userTier.color}, ${userTier.color}cc)`, borderRadius: '8px', boxShadow: `0 0 10px ${userTier.glow}` }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {Math.round(Math.max(0, ((store.totalXP - level.minXP) / (level.maxXP - level.minXP)) * 100))}% to next level — {Math.max(0, level.maxXP - store.totalXP)} XP needed
              </div>
              <ShareCard />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="container" style={{ maxWidth: '1000px', padding: 'clamp(20px, 3vw, 36px) clamp(12px, 3vw, 24px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="clipboard-list" value={allActivities.length} label="Activities Logged" color="#3B82F6" />
            <StatCard icon="wind"           value={formatCarbon(totalCarbon)} label="Total Emissions"  color="#EF4444" />
            <StatCard icon="zap"            value={store.totalXP}  label="XP Earned"        color="#F59E0B" />
            <StatCard icon="star"           value={store.coins}    label="Coins Earned"     color="#8B5CF6" />
          </motion.div>

          {/* ── Rankings Card (prominent) ───────────────────── */}
          <motion.div className="premium-card" style={{ padding: '24px' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="trophy" size={20} color="#F59E0B" /> Your Rankings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              {dynamicRanks.map(r => (
                <motion.div key={r.scope} whileHover={{ y: -3, scale: 1.02 }}
                  style={{ padding: '20px 16px', borderRadius: '16px', background: `${r.color}0D`, border: `1.5px solid ${r.color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{r.emoji}</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: r.color, lineHeight: 1 }}>#{r.rank}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '6px' }}>{r.scope}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>of {r.total.toLocaleString()} users</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Level Journey ───────────────────────────────── */}
          <motion.div className="premium-card" style={{ padding: '24px' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h3 className="text-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="map" size={18} color={userTier.color} /> Your Eco Journey — Level {level.level} of 10
            </h3>
            <LevelJourney currentLevel={level.level} totalXP={store.totalXP} />
          </motion.div>

          {/* ── Virtual Forest ─────────────────────────────── */}
          <motion.div className="premium-card" style={{ padding: '24px' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="text-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="tree-deciduous" size={20} color="var(--primary)" /> Virtual Forest
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 700 }}>Level {store.forestLevel}</span>
                <div style={{ background: '#FEF3C7', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon name="star" color="#D97706" size={14} />
                  <span style={{ fontWeight: 700, color: '#D97706', fontSize: '0.9rem' }}>{store.coins}</span>
                </div>
              </div>
            </div>
            <VirtualForest level={store.forestLevel} plantedTrees={store.plantedTrees} />
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePlantTree}
                style={{ background: 'linear-gradient(90deg, #10B981, #059669)', border: 'none', padding: '12px 28px', borderRadius: '10px', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: store.coins >= treeCost ? 1 : 0.65, boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                <Icon name="sprout" size={18} /> Plant a Tree ({treeCost} Coins)
              </motion.button>
            </div>
          </motion.div>

          {/* ── Carbon Chart ────────────────────────────────── */}
          <motion.div className="premium-card" style={{ padding: '24px' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h3 className="text-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="trending-up" size={18} color="var(--primary)" /> Weekly Carbon Trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '10px' }} labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }} itemStyle={{ color: 'var(--primary)', fontWeight: 700 }} />
                <Area type="monotone" dataKey="carbon" name="kg CO₂" stroke="#10B981" strokeWidth={3} fill="url(#carbonGrad)" dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* ── Badge Gallery (by tier) ──────────────────────── */}
          <motion.div className="premium-card" style={{ padding: '24px' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="text-card-title" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="medal" size={18} color="#8B5CF6" /> Badge Collection
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Hover locked badges to see how to earn them. Earn all to become a Climate Hero!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {badgesByTier.map(({ tier, tierInfo, badges }) => (
                <div key={tier}>
                  {/* Tier header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ height: '1px', flex: 1, background: `${tierInfo.color}30` }} />
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 16px', borderRadius: '24px', background: `${tierInfo.color}18`, border: `1px solid ${tierInfo.color}40` }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tierInfo.color, boxShadow: `0 0 8px ${tierInfo.glow}` }} />
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: tierInfo.color }}>Tier {tier} — {tierInfo.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {badges.filter(b => b.unlocked).length}/{badges.length} unlocked
                      </span>
                    </div>
                    <div style={{ height: '1px', flex: 1, background: `${tierInfo.color}30` }} />
                  </div>

                  {/* Badge grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px,100%), 1fr))', gap: '12px' }}>
                    {badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
