import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';

/* ── Animated SVG Cartoon Avatars ─────────────── */
const CartoonAvatarSVG = ({ id }) => {
  const configs = {
    1: { skin: '#FDBCB4', hair: '#2D1B00', hairStyle: 'short', outfit: '#00C896', bg: '#DCFCE7', accessory: null, glasses: false },
    2: { skin: '#8D5524', hair: '#1A1A1A', hairStyle: 'braids', outfit: '#F97316', bg: '#FEF3C7', accessory: 'earrings', glasses: false },
    3: { skin: '#FDBCB4', hair: '#4A4A4A', hairStyle: 'short', outfit: '#3B82F6', bg: '#DBEAFE', accessory: null, glasses: true },
    4: { skin: '#C68642', hair: '#8B0000', hairStyle: 'curly', outfit: '#A855F7', bg: '#F3E8FF', accessory: null, glasses: false },
    5: { skin: '#FDBCB4', hair: '#5C3A1E', hairStyle: 'none', outfit: '#EF4444', bg: '#FEE2E2', accessory: 'beard', glasses: false },
  };
  const c = configs[id] || configs[1];

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill={c.bg} />

      {/* Body / Shirt */}
      <ellipse cx="50" cy="88" rx="28" ry="18" fill={c.outfit} />
      <ellipse cx="50" cy="75" rx="20" ry="14" fill={c.outfit} />

      {/* Neck */}
      <rect x="44" y="58" width="12" height="10" rx="4" fill={c.skin} />

      {/* Head */}
      <ellipse cx="50" cy="48" rx="22" ry="24" fill={c.skin} />

      {/* Hair */}
      {c.hairStyle === 'short' && (
        <ellipse cx="50" cy="30" rx="22" ry="10" fill={c.hair} />
      )}
      {c.hairStyle === 'braids' && (
        <>
          <ellipse cx="50" cy="28" rx="22" ry="10" fill={c.hair} />
          <rect x="30" y="28" width="6" height="22" rx="3" fill={c.hair} />
          <rect x="64" y="28" width="6" height="22" rx="3" fill={c.hair} />
        </>
      )}
      {c.hairStyle === 'curly' && (
        <>
          {[28,35,42,49,56,63,70].map((x, i) => (
            <circle key={i} cx={x} cy={27 + (i % 2) * 3} r="7" fill={c.hair} />
          ))}
        </>
      )}
      {c.hairStyle === 'none' && (
        <ellipse cx="50" cy="30" rx="22" ry="10" fill={c.skin} />
      )}

      {/* Eyes */}
      {c.glasses ? (
        <>
          <circle cx="40" cy="48" r="6" fill="white" stroke="#374151" strokeWidth="2" />
          <circle cx="60" cy="48" r="6" fill="white" stroke="#374151" strokeWidth="2" />
          <circle cx="41" cy="48" r="3" fill="#1E3A5F" />
          <circle cx="61" cy="48" r="3" fill="#1E3A5F" />
          <line x1="46" y1="48" x2="54" y2="48" stroke="#374151" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="40" cy="48" r="4" fill="#1A1A1A" />
          <circle cx="60" cy="48" r="4" fill="#1A1A1A" />
          <circle cx="41.5" cy="46.5" r="1.2" fill="white" />
          <circle cx="61.5" cy="46.5" r="1.2" fill="white" />
        </>
      )}

      {/* Eyebrows */}
      <path d="M36 43 Q40 41 44 43" stroke={c.hair === '#2D1B00' ? '#4A3520' : c.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 43 Q60 41 64 43" stroke={c.hair === '#2D1B00' ? '#4A3520' : c.hair} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <ellipse cx="50" cy="54" rx="2.5" ry="2" fill={c.skin === '#FDBCB4' ? '#F0A090' : '#7A4520'} />

      {/* Smile */}
      <path d="M42 60 Q50 66 58 60" stroke="#D4704A" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Beard */}
      {c.accessory === 'beard' && (
        <ellipse cx="50" cy="63" rx="14" ry="8" fill={c.hair} opacity="0.7" />
      )}

      {/* Earrings */}
      {c.accessory === 'earrings' && (
        <>
          <circle cx="28" cy="52" r="3" fill="#F59E0B" />
          <circle cx="72" cy="52" r="3" fill="#F59E0B" />
        </>
      )}
    </svg>
  );
};

const PRESET_AVATARS = [
  { id: 'c1', type: 'svg', svgId: 1, label: 'Eco Guy' },
  { id: 'c2', type: 'svg', svgId: 2, label: 'Braids Girl' },
  { id: 'c3', type: 'svg', svgId: 3, label: 'Glasses Guy' },
  { id: 'c4', type: 'svg', svgId: 4, label: 'Curly Girl' },
  { id: 'c5', type: 'svg', svgId: 5, label: 'Bearded Man' },
];

export default function AvatarPicker({ onClose }) {
  const { user, updateUser } = useAuthStore();
  const [selected, setSelected] = useState(null);
  const [customImg, setCustomImg] = useState(null);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large! Max 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomImg(ev.target.result);
      setSelected('custom');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selected) {
      toast.error('Please pick an avatar first!');
      return;
    }

    let avatarValue;
    if (selected === 'custom' && customImg) {
      avatarValue = customImg;
    } else {
      // Store the SVG key — Profile + Navbar both render this inline
      avatarValue = `__svg__${selected}`;
    }

    // updateUser now always applies locally first — will work even if backend fails
    const result = await updateUser({ avatar: avatarValue });

    if (result && result.success) {
      const label = PRESET_AVATARS.find(a => a.id === selected)?.label || 'Photo';
      toast.success(`✅ Avatar changed to "${selected === 'custom' ? 'Your Photo' : label}"!`);
      onClose();
    } else {
      // Avatar still saved locally — just show a softer warning
      toast.warn('Avatar saved locally. Sync to server failed, but your avatar is visible now.');
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
          🎨 Choose Your Avatar
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
          Pick a cartoon character or upload your own photo
        </p>

        {/* Cartoon Presets */}
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
          Animated Cartoon Avatars
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {PRESET_AVATARS.map((av) => (
            <motion.div
              key={av.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setSelected(av.id); setCustomImg(null); }}
              style={{
                width: '80px', cursor: 'pointer', textAlign: 'center',
              }}
            >
              <motion.div
                animate={selected === av.id ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] } : {}}
                transition={{ duration: 0.5 }}
                style={{
                  width: '76px', height: '76px', borderRadius: '50%',
                  border: selected === av.id ? '3px solid #00C896' : '3px solid rgba(0,0,0,0.08)',
                  boxShadow: selected === av.id ? '0 0 0 4px rgba(0,200,150,0.2)' : 'none',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  background: '#F8FAFC',
                }}
              >
                <CartoonAvatarSVG id={av.svgId} />
              </motion.div>
              <p style={{ fontSize: '0.7rem', color: selected === av.id ? '#00C896' : 'var(--text-muted)', marginTop: '6px', fontWeight: selected === av.id ? 700 : 400 }}>
                {av.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Manual Upload */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Upload Your Own Photo
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {customImg && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{
                  width: '68px', height: '68px', borderRadius: '50%', overflow: 'hidden',
                  border: selected === 'custom' ? '3px solid #00C896' : '3px solid rgba(0,0,0,0.08)',
                  boxShadow: selected === 'custom' ? '0 0 0 4px rgba(0,200,150,0.2)' : 'none',
                  flexShrink: 0,
                }}
              >
                <img src={customImg} alt="custom" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fileRef.current.click()}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                border: '2px dashed rgba(0,200,150,0.4)',
                background: 'rgba(0,200,150,0.04)',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              📷 {customImg ? 'Change Photo' : 'Choose Photo (max 5MB)'}
            </motion.button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onClose}
            style={{ padding: '11px 24px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#F8FAFC', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: '11px 28px' }}
          >
            Save Avatar ✓
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
