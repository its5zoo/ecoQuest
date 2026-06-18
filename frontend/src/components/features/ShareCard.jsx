import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import Icon from '../shared/Icon';
import useTrackerStore from '../../store/trackerStore';

export default function ShareCard() {
  const store = useTrackerStore();
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const generateCard = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0F0D',
        scale: 2, // High res
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create a temporary link to download
      const link = document.createElement('a');
      link.download = `EcoQuest-Stats-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate share card', err);
    } finally {
      setGenerating(false);
    }
  };

  const totalCarbonStr = (store.dailyTotal).toFixed(1);

  return (
    <div>
      <motion.button
        onClick={generateCard}
        disabled={generating}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-outline"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <Icon name="share-2" size={18} />
        {generating ? 'Generating...' : 'Share My Impact'}
      </motion.button>

      {/* Hidden Card for html2canvas */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={cardRef} 
          style={{ 
            width: '400px', 
            height: '400px', 
            background: 'linear-gradient(135deg, #0A0F0D, #0F2D1A)',
            padding: '40px',
            color: '#F0FDF4',
            fontFamily: '"Poppins", sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '2px solid #00C896',
            borderRadius: '24px',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Icon name="leaf" color="#00C896" size={24} />
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>EcoQuest</span>
            </div>
            
            <h2 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '8px' }}>
              I'm taking action!
            </h2>
            <p style={{ color: '#A7F3D0', fontSize: '1.1rem' }}>
              My footprint today is only <strong style={{ color: '#00C896', fontSize: '1.4rem' }}>{totalCarbonStr}kg</strong> CO₂
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.8rem', textTransform: 'uppercase' }}>Level</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6' }}>{store.level.name}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.8rem', textTransform: 'uppercase' }}>Streak</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{store.streak} <Icon name="flame" size={16} color="#F59E0B" /></div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#6B7280', marginTop: '16px' }}>
            Join me at ecoquest.app
          </div>
        </div>
      </div>
    </div>
  );
}
