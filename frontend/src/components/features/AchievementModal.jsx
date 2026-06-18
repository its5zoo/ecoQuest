import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Icon from '../shared/Icon';
import useTrackerStore from '../../store/trackerStore';

export default function AchievementModal() {
  const store = useTrackerStore();
  const [unlockedQueue, setUnlockedQueue] = useState([]);
  const [currentBadge, setCurrentBadge] = useState(null);

  useEffect(() => {
    // Detect newly unlocked badges that we haven't shown yet
    const storedShown = JSON.parse(localStorage.getItem('shownBadges') || '[]');
    
    const newlyUnlocked = store.badges.filter(b => b.unlocked && !storedShown.includes(b.id));
    
    if (newlyUnlocked.length > 0) {
      setUnlockedQueue(prev => [...prev, ...newlyUnlocked]);
      localStorage.setItem('shownBadges', JSON.stringify([...storedShown, ...newlyUnlocked.map(b => b.id)]));
    }
  }, [store.badges]);

  useEffect(() => {
    if (!currentBadge && unlockedQueue.length > 0) {
      setCurrentBadge(unlockedQueue[0]);
      
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00C896', '#4ADE80', '#F59E0B']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#00C896', '#4ADE80', '#F59E0B']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [unlockedQueue, currentBadge]);

  const handleClose = () => {
    setUnlockedQueue(prev => prev.slice(1));
    setCurrentBadge(null);
  };

  return (
    <AnimatePresence>
      {currentBadge && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="glass-card"
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '40px 24px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(15,26,20,0.95), rgba(6,26,16,0.95))',
              border: '1px solid rgba(0,200,150,0.4)',
              boxShadow: '0 0 40px rgba(0,200,150,0.2)'
            }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [1.2, 1] }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00C896, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 20px rgba(0,200,150,0.5)'
              }}
            >
              <Icon name={currentBadge.icon} size={48} color="white" />
            </motion.div>
            
            <h4 style={{ color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', marginBottom: '8px' }}>
              Achievement Unlocked!
            </h4>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }} className="gradient-text">
              {currentBadge.name}
            </h2>
            <p style={{ color: 'rgba(240,253,244,0.7)', marginBottom: '32px', fontSize: '1.1rem' }}>
              {currentBadge.desc}
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Awesome!
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
