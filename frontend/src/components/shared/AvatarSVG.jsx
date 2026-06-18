const AVATAR_CONFIGS = {
  c1: { bg: '#DCFCE7', skin: '#FDBCB4', hair: '#2D1B00', outfit: '#00C896', glasses: false, braids: false, curly: false, beard: false, earrings: false },
  c2: { bg: '#FEF3C7', skin: '#8D5524', hair: '#1A1A1A', outfit: '#F97316', glasses: false, braids: true,  curly: false, beard: false, earrings: true  },
  c3: { bg: '#DBEAFE', skin: '#FDBCB4', hair: '#4A4A4A', outfit: '#3B82F6', glasses: true,  braids: false, curly: false, beard: false, earrings: false },
  c4: { bg: '#F3E8FF', skin: '#C68642', hair: '#8B0000', outfit: '#A855F7', glasses: false, braids: false, curly: true,  beard: false, earrings: false },
  c5: { bg: '#FEE2E2', skin: '#FDBCB4', hair: '#5C3A1E', outfit: '#EF4444', glasses: false, braids: false, curly: false, beard: true,  earrings: false },
  '1': { bg: '#DCFCE7', skin: '#FDBCB4', hair: '#2D1B00', outfit: '#00C896', glasses: false, braids: false, curly: false, beard: false, earrings: false },
  '2': { bg: '#FEF3C7', skin: '#8D5524', hair: '#1A1A1A', outfit: '#F97316', glasses: false, braids: true,  curly: false, beard: false, earrings: true  },
  '3': { bg: '#DBEAFE', skin: '#FDBCB4', hair: '#4A4A4A', outfit: '#3B82F6', glasses: true,  braids: false, curly: false, beard: false, earrings: false },
  '4': { bg: '#F3E8FF', skin: '#C68642', hair: '#8B0000', outfit: '#A855F7', glasses: false, braids: false, curly: true,  beard: false, earrings: false },
  '5': { bg: '#FEE2E2', skin: '#FDBCB4', hair: '#5C3A1E', outfit: '#EF4444', glasses: false, braids: false, curly: false, beard: true,  earrings: false },
};

export default function AvatarSVG({ svgId }) {
  const c = AVATAR_CONFIGS[svgId] || AVATAR_CONFIGS.c1;
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }} role="img" aria-label="User avatar">
      <circle cx="50" cy="50" r="50" fill={c.bg} />
      <ellipse cx="50" cy="88" rx="28" ry="18" fill={c.outfit} />
      <ellipse cx="50" cy="75" rx="20" ry="14" fill={c.outfit} />
      <rect x="44" y="58" width="12" height="10" rx="4" fill={c.skin} />
      <ellipse cx="50" cy="48" rx="22" ry="24" fill={c.skin} />
      {!c.braids && !c.curly && <ellipse cx="50" cy="30" rx="22" ry="10" fill={c.hair} />}
      {c.braids && (<><ellipse cx="50" cy="28" rx="22" ry="10" fill={c.hair} /><rect x="30" y="28" width="6" height="22" rx="3" fill={c.hair} /><rect x="64" y="28" width="6" height="22" rx="3" fill={c.hair} /></>)}
      {c.curly && [28,35,42,49,56,63,70].map((x, i) => <circle key={i} cx={x} cy={27+(i%2)*3} r="7" fill={c.hair} />)}
      {c.glasses ? (<><circle cx="40" cy="48" r="6" fill="white" stroke="#374151" strokeWidth="2" /><circle cx="60" cy="48" r="6" fill="white" stroke="#374151" strokeWidth="2" /><circle cx="41" cy="48" r="3" fill="#1E3A5F" /><circle cx="61" cy="48" r="3" fill="#1E3A5F" /><line x1="46" y1="48" x2="54" y2="48" stroke="#374151" strokeWidth="2" /></>) : (<><circle cx="40" cy="48" r="4" fill="#1A1A1A" /><circle cx="60" cy="48" r="4" fill="#1A1A1A" /><circle cx="41.5" cy="46.5" r="1.2" fill="white" /><circle cx="61.5" cy="46.5" r="1.2" fill="white" /></>)}
      <path d="M36 43 Q40 41 44 43" stroke={c.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 43 Q60 41 64 43" stroke={c.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="54" rx="2.5" ry="2" fill="#F0A090" />
      <path d="M42 60 Q50 66 58 60" stroke="#D4704A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {c.beard && <ellipse cx="50" cy="63" rx="14" ry="8" fill={c.hair} opacity="0.7" />}
      {c.earrings && (<><circle cx="28" cy="52" r="3" fill="#F59E0B" /><circle cx="72" cy="52" r="3" fill="#F59E0B" /></>)}
    </svg>
  );
}
