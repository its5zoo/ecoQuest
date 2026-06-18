import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../shared/Icon';
import useTrackerStore from '../../store/trackerStore';
import { generateSmartInsights, generateLiveScoreMessage } from '../../services/aiEngine';

export default function LiveScoreEngine() {
  const store = useTrackerStore();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Generate static insights based on weekly data
    const weeklyActivities = store.activities.slice(0, 20); // simplify for MVP
    const insights = generateSmartInsights(weeklyActivities);
    
    setMessages(insights.map((ins, i) => ({
      id: `ins-${i}`,
      ...ins,
      isAlert: ins.type === 'alert'
    })));
  }, [store.activities]);

  // Listen to new activities for "Live Score" animation
  useEffect(() => {
    if (store.activities.length > 0) {
      const latest = store.activities[0];
      // Only show if it's very recent (last 10 seconds)
      const isRecent = new Date() - new Date(latest.timestamp) < 10000;
      if (isRecent) {
        const msg = generateLiveScoreMessage(latest);
        const liveMsg = {
          id: `live-${latest.id}`,
          message: msg,
          category: latest.category,
          type: 'live',
          isAlert: false
        };
        setMessages(prev => [liveMsg, ...prev].slice(0, 4));
      }
    }
  }, [store.activities]);

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="zap" color="#F59E0B" /> Live AI Engine
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 10px #4ADE80' }} />
          <span style={{ fontSize: '0.75rem', color: '#4ADE80', fontWeight: 600 }}>ACTIVE</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.95, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: msg.isAlert ? 'rgba(239, 68, 68, 0.08)' : msg.type === 'live' ? 'rgba(0, 200, 150, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                borderLeft: `3px solid ${msg.isAlert ? '#EF4444' : msg.type === 'live' ? '#00C896' : '#3B82F6'}`,
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ marginTop: '2px' }}>
                  {msg.isAlert ? <Icon name="alert-triangle" color="#EF4444" size={20} /> :
                   msg.type === 'live' ? <Icon name="zap" color="#00C896" size={20} /> :
                   <Icon name="lightbulb" color="#3B82F6" size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 600 }}>
                    {msg.type === 'live' ? 'Just Now' : msg.category}
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    {msg.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
