import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../shared/Icon';
import useTrackerStore from '../../store/trackerStore';

function timeUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function QuestBoard() {
  const store = useTrackerStore();
  const [timeLeft, setTimeLeft] = useState(timeUntilMidnight());

  // Update countdown every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(timeUntilMidnight());
      // Auto-refresh if date changed
      const today = new Date().toDateString();
      if (store.questDate !== today) {
        store.refreshDailyQuests();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [store.questDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = (id) => {
    store.completeQuest(id);
  };

  const completedCount = store.quests.filter(q => q.completed).length;
  const totalCount = store.quests.length;

  return (
    <div className="premium-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 className="text-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Icon name="map" color="var(--primary)" /> Daily Quests
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="clock" size={12} color="var(--text-muted)" />
            Resets in <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{timeLeft}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
            <Icon name="star" color="#F59E0B" size={16} />
            <span style={{ fontWeight: 700, color: '#F59E0B' }}>{store.coins} Coins</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {completedCount}/{totalCount} completed
          </div>
        </div>
      </div>

      {/* Progress Bar (overall) */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), #4ADE80)', borderRadius: '3px' }}
          />
        </div>
      </div>

      {/* Quest Cards */}
      <div style={{ display: 'grid', gap: '14px' }}>
        <AnimatePresence>
          {store.quests.map((quest, i) => {
            const pct = Math.min(100, (quest.progress / quest.target) * 100);
            const isReady = !quest.completed && quest.progress >= quest.target;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: quest.completed ? 'rgba(0,200,150,0.05)' : '#F8FAFC',
                  borderRadius: '14px',
                  padding: '16px',
                  border: quest.completed
                    ? '1px solid rgba(0,200,150,0.3)'
                    : isReady
                    ? '1px solid rgba(245,158,11,0.4)'
                    : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                      <span style={{
                        fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                        background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px',
                        color: 'var(--primary)', fontWeight: 700
                      }}>
                        {quest.type}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 500 }}>
                        {quest.category}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.92rem', color: quest.completed ? 'var(--primary)' : 'var(--text-primary)', lineHeight: 1.3 }}>
                      {quest.title}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700 }}>+{quest.rewardXP} XP</div>
                    <div style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 700 }}>+{quest.rewardCoins} 🪙</div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        borderRadius: '4px',
                        background: quest.completed
                          ? 'var(--primary)'
                          : isReady
                          ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                          : 'linear-gradient(90deg, #3B82F6, #10B981)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: '48px', textAlign: 'right', fontWeight: 700 }}>
                    {Math.min(quest.progress, quest.target).toFixed(quest.target >= 10 ? 0 : 1)} / {quest.target} {quest.unit}
                  </span>
                </div>

                {/* Claim Button */}
                {isReady && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleClaim(quest.id)}
                    style={{
                      width: '100%', marginTop: '12px',
                      background: 'linear-gradient(90deg, #F59E0B, #D97706)',
                      color: '#fff', border: 'none', padding: '10px',
                      borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                      fontSize: '0.9rem', letterSpacing: '0.3px',
                    }}
                  >
                    🎉 Claim Reward
                  </motion.button>
                )}

                {quest.completed && (
                  <div style={{ marginTop: '10px', textAlign: 'center', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Icon name="check-circle" size={14} /> Quest Complete!
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
