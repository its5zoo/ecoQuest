import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import useTrackerStore from '../store/trackerStore';
import { formatCarbon, timeAgo, getScoreColor, getProgressGradient } from '../utils/helpers';
import { CATEGORIES, QUICK_ACTIVITIES, getRiskLevel, calcDailyScore, getLevel } from '../utils/carbonLogic';
import Icon from '../components/shared/Icon';
import QuestBoard from '../components/features/QuestBoard';

/* ── Live Impact Panel ── */
const INDIAN_NAMES = ['Aarav S.','Priya M.','Rohan G.','Ananya P.','Vikram R.','Kavya N.','Arjun V.','Deepika K.','Siddharth J.','Sneha I.','Karan B.','Pooja A.','Rahul D.','Riya C.','Aditya L.'];
const ACTIVITIES_LIVE = [
  { text: 'walked 3.2 km instead of driving', saved: '0.74 kg', icon: '🚶' },
  { text: 'logged a vegetarian meal', saved: '1.5 kg', icon: '🥗' },
  { text: 'switched off AC for 2 hrs', saved: '0.5 kg', icon: '❄️' },
  { text: 'recycled 5 plastic bottles', saved: '0.3 kg', icon: '♻️' },
  { text: 'took a 4-min shower', saved: '0.2 kg', icon: '🚿' },
  { text: 'used public bus today', saved: '1.1 kg', icon: '🚌' },
  { text: 'planted a tree 🌱', saved: '0.05 kg', icon: '🌳' },
  { text: 'cycled 6 km to work', saved: '1.3 kg', icon: '🚴' },
  { text: 'cooked at home (no delivery)', saved: '0.8 kg', icon: '🍳' },
  { text: 'reused a shopping bag', saved: '0.1 kg', icon: '🛍️' },
];

function LiveImpactPanel({ dailyTotal }) {
  const BASE = { logs: 18420, co2: 84320.5, trees: 2140 };
  const [stats, setStats] = useState(BASE);
  const [feed, setFeed] = useState([]);
  const [liveGrowth, setLiveGrowth] = useState(0);
  const feedRef = useRef(null);

  // Grow global counters every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(s => ({
        logs: s.logs + Math.floor(Math.random() * 4) + 1,
        co2: parseFloat((s.co2 + Math.random() * 2.5 + 0.5).toFixed(1)),
        trees: s.trees + (Math.random() > 0.85 ? 1 : 0),
      }));
      setLiveGrowth(prev => prev + (Math.random() * 0.002 + 0.001));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // New activity in feed every 4–7s
  useEffect(() => {
    const push = () => {
      const act = ACTIVITIES_LIVE[Math.floor(Math.random() * ACTIVITIES_LIVE.length)];
      const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
      setFeed(f => [{ id: Date.now(), name, ...act }, ...f].slice(0, 5));
    };
    push();
    const interval = setInterval(push, 5000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const currentTotal = dailyTotal + liveGrowth;

  return (
    <motion.div className="premium-card" style={{ padding: '22px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 className="text-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Icon name="globe" size={20} color="var(--primary)" /> Real-World Impact
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.08)', padding: '4px 10px', borderRadius: '20px' }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }}
          />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444', letterSpacing: '0.5px' }}>LIVE</span>
        </div>
      </div>

      {/* Your personal equivalency */}
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Your <strong style={{ color: 'var(--text-primary)' }}>{formatCarbon(currentTotal)}</strong> today is equivalent to:
      </p>
      <div className="equiv-grid-3" style={{ marginBottom: '20px' }}>
        {[
          { icon: 'smartphone', color: '#3B82F6', bg: 'rgba(59,130,246,0.07)', val: Math.round(currentTotal * 121).toLocaleString(), label: 'Phones Charged' },
          { icon: 'car', color: '#F59E0B', bg: 'rgba(245,158,11,0.07)', val: `${(currentTotal * 4.02).toFixed(1)} km`, label: 'Car Distance' },
          { icon: 'tree-deciduous', color: '#10B981', bg: 'rgba(16,185,129,0.07)', val: (currentTotal / 21).toFixed(2), label: 'Tree Years' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}22`, padding: '12px 8px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}><Icon name={c.icon} size={20} color={c.color} /></div>
            <motion.div key={c.val} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '1.1rem', fontWeight: 800, color: c.color }}>
              {c.val}
            </motion.div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '16px' }} />

      {/* Global Live Counters */}
      <div className="equiv-grid-3" style={{ marginBottom: '18px' }}>
        {[
          { label: 'Activities Logged Today', val: stats.logs.toLocaleString(), color: 'var(--primary)', icon: '📊' },
          { label: 'kg CO₂ Saved Globally', val: stats.co2.toLocaleString(), color: '#3B82F6', icon: '🌍' },
          { label: 'Trees Planted Today', val: stats.trees.toLocaleString(), color: '#10B981', icon: '🌳' },
        ].map(s => (
          <motion.div
            key={s.label}
            style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div style={{ fontSize: '1rem', marginBottom: '4px' }}>{s.icon}</div>
            <motion.div
              key={s.val}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '1rem', fontWeight: 800, color: s.color }}
            >
              {s.val}
            </motion.div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.3 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Live Activity Feed */}
      <div style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
          COMMUNITY ACTIVITY
        </div>
        <div ref={feedRef} style={{ maxHeight: '155px', overflow: 'hidden' }}>
          <AnimatePresence>
            {feed.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> {item.text}</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0,200,150,0.1)', padding: '2px 7px', borderRadius: '8px', flexShrink: 0 }}>
                  -{item.saved}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}



const CATEGORY_LIST = Object.entries(CATEGORIES).map(([id, c]) => ({ id, ...c }));

const ECO_FACTS = [
  "Turning off your computer when not in use can cut its energy use by up to 85%.",
  "A single mature tree can absorb up to 21 kg of CO₂ per year.",
  "If every household replaced one incandescent bulb with an LED, it would save enough energy to light 3 million homes.",
  "Meat production is responsible for nearly 15% of total global greenhouse gas emissions.",
  "Recycling one aluminum can saves enough energy to run a TV for three hours.",
  "Walking or biking instead of driving just 2 miles a day can reduce your carbon footprint by 1,500 pounds a year.",
  "Eating one plant-based meal a day for a year saves the equivalent emissions of driving 3,000 miles."
];

function ActivityForm({ onAdd }) {
  const [form, setForm] = useState({
    name: '',
    category: 'transport',
    quantity: 1,
    unit: 'km',
    carbonKg: 0,
    notes: '',
  });
  const [selectedQuick, setSelectedQuick] = useState(null);

  const handleQuickSelect = (qa) => {
    setSelectedQuick(qa.id);
    setForm(f => ({
      ...f,
      name: qa.name,
      category: qa.category,
      unit: qa.unit,
      carbonKg: parseFloat((qa.factor * f.quantity).toFixed(4)),
    }));
  };

  const handleQuantityChange = (val) => {
    const q = parseFloat(val) || 0;
    const qa = QUICK_ACTIVITIES.find(qa => qa.id === selectedQuick);
    setForm(f => ({
      ...f,
      quantity: q,
      carbonKg: qa ? parseFloat((qa.factor * q).toFixed(4)) : f.carbonKg,
    }));
  };

  const handleManualCarbon = (val) => {
    setForm(f => ({ ...f, carbonKg: parseFloat(val) || 0 }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter an activity name');
      return;
    }
    const result = onAdd({ ...form, carbonKg: parseFloat(form.carbonKg) || 0 });
    setForm({ name: '', category: 'transport', quantity: 1, unit: 'km', carbonKg: 0, notes: '' });
    setSelectedQuick(null);
    
    if (result) {
      toast.success(`✅ Activity logged! +${result.xpEarned} XP` + (result.coinsEarned > 0 ? ` and +${result.coinsEarned} Coins` : ''));
    }
  };

  return (
    <motion.div
      className="premium-card"
      style={{ padding: '28px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon name="sprout" size={20} color="var(--primary)" /> Log New Activity
      </h2>

      {/* Quick Select */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Quick Add</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {QUICK_ACTIVITIES.slice(0, 8).map(qa => (
            <motion.button
              key={qa.id}
              onClick={() => handleQuickSelect(qa)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedQuick === qa.id ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
                background: selectedQuick === qa.id ? '#DCFCE7' : '#F1F5F9',
                color: selectedQuick === qa.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name={CATEGORIES[qa.category]?.icon} size={16} />
                {qa.name}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="form-grid-2">
          <div>
            <label htmlFor="tracker-activity-name" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Activity Name *</label>
            <input
              id="tracker-activity-name"
              className="input-field"
              placeholder="e.g., Drove to work"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="tracker-activity-category" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Category</label>
            <select
              id="tracker-activity-category"
              className="input-field"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORY_LIST.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-3">
          <div>
            <label htmlFor="tracker-activity-quantity" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Quantity</label>
            <input
              id="tracker-activity-quantity"
              type="number"
              min="0"
              step="0.1"
              className="input-field"
              value={form.quantity}
              onChange={e => handleQuantityChange(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="tracker-activity-unit" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Unit</label>
            <select id="tracker-activity-unit" className="input-field" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {['km', 'hours', 'kWh', 'litres', 'meals', 'items', 'kg', 'mins'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tracker-activity-carbon" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>CO₂ (kg)</label>
            <input
              id="tracker-activity-carbon"
              type="number"
              min="0"
              step="0.001"
              className="input-field"
              value={form.carbonKg}
              onChange={e => handleManualCarbon(e.target.value)}
            />
          </div>
        </div>

        <motion.button
          type="submit"
          className="btn-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ alignSelf: 'stretch', padding: '12px 28px' }}
        >
          <span>Log Activity ✓</span>
        </motion.button>
      </form>
    </motion.div>
  );
}

function ActivityCard({ activity, onDelete }) {
  const cat = CATEGORIES[activity.category];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      className="premium-card"
      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}
      whileHover={{ x: 2 }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: `${cat?.color || '#6B7280'}15`,
        border: `1px solid ${cat?.color || '#6B7280'}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0,
      }}>
        <Icon name={cat?.icon || 'package'} size={22} color={cat?.color || '#6B7280'} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activity.name}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat?.label}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activity.quantity} {activity.unit}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(activity.timestamp)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: activity.carbonKg > 2 ? 'var(--danger)' : activity.carbonKg > 0.5 ? 'var(--warning)' : 'var(--primary)', fontSize: '0.95rem' }}>
          {formatCarbon(activity.carbonKg)}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CO₂</div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <motion.button
          onClick={() => onDelete(activity.id)}
          whileHover={{ scale: 1.1, background: 'rgba(239,68,68,0.2)' }}
          whileTap={{ scale: 0.9 }}
          style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid rgba(239,68,68,0.25)',
            background: '#FEE2E2',
            color: 'var(--danger)',
            cursor: 'pointer', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="trash-2" size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Tracker() {
  const store = useTrackerStore();
  const todayActivities = store.getTodayActivities();
  const dailyTotal = todayActivities.reduce((s, a) => s + a.carbonKg, 0);
  const dailyScore = calcDailyScore(dailyTotal);
  const risk = getRiskLevel(dailyTotal);
  const level = getLevel(store.totalXP);
  const scoreColor = getScoreColor(dailyScore);
  const suggestions = store.suggestions;
  const weeklyData = store.getWeeklyData();

  const handleAddActivity = (activity) => {
    return store.addActivity(activity);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark-100)', padding: 'clamp(20px, 5vw, 40px) 0' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
          <h1 className="section-title" style={{ fontSize: '2.2rem' }}>
            Daily Carbon <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-body" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Log your activities and monitor your environmental impact in real-time.</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 items-start">
          {/* LEFT: Form + Activities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ActivityForm onAdd={handleAddActivity} />

            {/* Today's Activities */}
            <div className="premium-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 className="text-card-title">Today's Activities ({todayActivities.length})</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Total: {formatCarbon(dailyTotal)}
                </span>
              </div>

              {todayActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.5 }}>
                    <Icon name="package" size={48} />
                  </div>
                  <p className="text-body">No activities logged today. Start tracking your carbon footprint!</p>
                </div>
              ) : (
                <AnimatePresence>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {todayActivities.map(a => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        onDelete={store.deleteActivity}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <motion.div className="premium-card" style={{ padding: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-card-title" style={{ marginBottom: '16px' }}>💡 Smart Suggestions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {suggestions.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: '#DCFCE7',
                        border: '1px solid #BBF7D0',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }}>
                        <Icon name={s.icon} size={22} />
                      </span>
                      <div>
                        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>{s.text}</p>
                        {s.saving && (
                          <span className="badge badge-green" style={{ marginTop: '8px', fontSize: '0.7rem' }}>
                            💚 Saves {s.saving}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Real-World Impact — Live Global Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <LiveImpactPanel dailyTotal={dailyTotal} />

              {/* Daily Eco Fact */}
              <motion.div className="premium-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(0,200,150,0.05), rgba(16,185,129,0.1))', border: '1px solid rgba(0,200,150,0.2)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ background: '#FFFFFF', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <Icon name="lightbulb" size={24} color="#F59E0B" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>Daily Eco-Fact</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
                      "{ECO_FACTS[new Date().getDate() % ECO_FACTS.length]}"
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>

          {/* RIGHT: Score + Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Daily Score */}
            <motion.div
              className="premium-card"
              style={{ padding: '28px', textAlign: 'center' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Today's Eco Score
              </h3>
              {/* Circular indicator */}
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 16px' }}>
                <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                  <motion.circle
                    cx="70" cy="70" r="58"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 58}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - dailyScore / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                    {dailyScore}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <motion.div 
                  whileHover={{ y: -2, boxShadow: `0 8px 16px ${risk.color}30` }} 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    background: `linear-gradient(145deg, ${risk.bg}ee, ${risk.bg}77)`,
                    backdropFilter: 'blur(8px)',
                    color: risk.color,
                    border: `1px solid ${risk.color}40`,
                    borderTopColor: 'rgba(255,255,255,0.7)',
                    borderLeftColor: 'rgba(255,255,255,0.7)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ padding: '4px', background: `${risk.color}15`, borderRadius: '6px', display: 'flex' }}>
                    <Icon name={risk.icon} size={14} />
                  </div>
                  {risk.level} Risk
                </motion.div>
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {formatCarbon(dailyTotal)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>emitted today</div>
            </motion.div>

            {/* Gamification */}
            <motion.div
              className="premium-card"
              style={{ padding: '24px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-card-title" style={{ marginBottom: '16px' }}>🏆 Your Progress</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'XP Earned', value: store.totalXP, icon: '⚡', color: '#F59E0B' },
                  { label: 'Day Streak', value: `${store.streak}🔥`, icon: '🔥', color: '#EF4444' },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '14px', borderRadius: '12px', background: '#F8FAFC', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              
              {/* Advanced Streaks */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, padding: '10px', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.9rem', color: '#3B82F6', fontWeight: 700 }}>{store.weeklyStreak} <Icon name="calendar" size={12} /></div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Week Streak</div>
                </div>
                <div style={{ flex: 1, padding: '10px', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.9rem', color: '#8B5CF6', fontWeight: 700 }}>{store.monthlyStreak} <Icon name="calendar" size={12} /></div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Month Streak</div>
                </div>
              </div>

              {/* Level progress */}
              <div style={{ padding: '14px', borderRadius: '12px', background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>Lv.{level.level} {level.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{store.totalXP} XP</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((store.totalXP - level.minXP) / Math.max(1, (level.minXP * 2) - level.minXP)) * 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Badges */}
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Badges</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {store.badges.slice(0, 6).map(badge => (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.2 }}
                      title={badge.unlocked ? badge.name : `Locked: ${badge.desc}`}
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: badge.unlocked ? '#DCFCE7' : '#F1F5F9',
                        border: `1px solid ${badge.unlocked ? '#BBF7D0' : 'rgba(0,0,0,0.05)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem',
                        opacity: badge.unlocked ? 1 : 0.3,
                        cursor: 'help',
                        filter: badge.unlocked ? 'none' : 'grayscale(1)',
                      }}
                    >
                      <Icon name={badge.icon} size={20} color={badge.unlocked ? '#00C896' : '#fff'} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Weekly Summary */}
            <motion.div
              className="premium-card"
              style={{ padding: '24px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-card-title" style={{ marginBottom: '16px' }}>📅 This Week</h3>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px' }}>
                {weeklyData.map((day, i) => {
                  const maxCarbon = Math.max(...weeklyData.map(d => d.carbon), 1);
                  const height = Math.max(4, (day.carbon / maxCarbon) * 68);
                  const isToday = i === 6;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}px` }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
                        style={{
                          width: '100%',
                          background: isToday
                            ? 'linear-gradient(to top, #00C896, #4ADE80)'
                            : getProgressGradient(day.score),
                          borderRadius: '4px',
                          opacity: isToday ? 1 : 0.6,
                        }}
                        title={`${day.day}: ${day.carbon} kg CO₂`}
                      />
                      <span style={{ fontSize: '0.65rem', color: isToday ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Daily Summary */}
            <motion.div
              className="premium-card"
              style={{ padding: '20px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-card-title" style={{ marginBottom: '14px' }}>📋 Daily Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Activities Logged', value: todayActivities.length },
                  { label: 'Total Emissions', value: formatCarbon(dailyTotal) },
                  {
                    label: 'Most Polluting',
                    value: todayActivities.length > 0
                      ? todayActivities.reduce((max, a) => a.carbonKg > max.carbonKg ? a : max, todayActivities[0])?.name
                      : 'None yet',
                  },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quest Board */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <QuestBoard />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
