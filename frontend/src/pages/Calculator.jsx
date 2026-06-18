import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { calculateFootprint, getRiskLevel } from '../utils/carbonLogic';
import { formatCarbon } from '../utils/helpers';
import Icon from '../components/shared/Icon';

const FOOD_OPTIONS = [
  { value: 'veg',        icon: 'carrot',   label: 'Vegetarian', desc: 'Plant-based diet' },
  { value: 'mixed',      icon: 'utensils', label: 'Mixed',       desc: 'Mix of meat & veg' },
  { value: 'meat_heavy', icon: 'beef',     label: 'Meat-Heavy',  desc: 'High meat consumption' },
];

const INPUT_CONFIG = [
  { key: 'electricityKWh', label: 'Electricity Usage', icon: 'zap', unit: 'kWh/day', min: 0, max: 50,  step: 0.5, desc: 'Average Indian home: 8-12 kWh/day' },
  { key: 'vehicleKm',      label: 'Vehicle Distance',  icon: 'car', unit: 'km/day',  min: 0, max: 200, step: 1,   desc: 'Avg commute: 15-40 km/day' },
  { key: 'waterLitres',    label: 'Water Usage',       icon: 'droplets', unit: 'L/day',   min: 0, max: 500, step: 5,   desc: 'Avg person: 100-200 L/day' },
  { key: 'plasticPerDay',  label: 'Plastic Items',     icon: 'recycle', unit: 'items',   min: 0, max: 20,  step: 1,   desc: 'Bottles, bags, packaging' },
];

const PIE_COLORS = {
  electricity: '#F59E0B',
  vehicle:     '#3B82F6',
  water:       '#06B6D4',
  food:        '#10B981',
  waste:       '#EF4444',
};

const IMPROVEMENT_TIPS = {
  electricity: ['Switch to LED bulbs', 'Use solar energy', 'Turn off idle appliances', 'Set AC to 24°C+', 'Use energy-efficient appliances'],
  vehicle:     ['Use public transport', 'Carpool with colleagues', 'Switch to EV or hybrid', 'Walk for trips under 2km', 'Service your vehicle regularly'],
  water:       ['Take shorter showers', 'Fix leaking taps', 'Reuse grey water', 'Install low-flow fixtures', 'Water plants in the morning'],
  food:        ['Try meatless Mondays', 'Buy local & seasonal produce', 'Reduce food waste', 'Compost kitchen scraps', 'Choose plant-based alternatives'],
  waste:       ['Use reusable bottles', 'Avoid single-use plastic', 'Recycle properly', 'Buy second-hand items', 'Repair instead of replacing'],
};

const CO2_SAVINGS = {
  electricity: '1.2 kg CO₂/day saved',
  vehicle:     '2.4 kg CO₂/day saved',
  water:       '0.3 kg CO₂/day saved',
  food:        '1.5 kg CO₂/day saved',
  waste:       '0.8 kg CO₂/day saved',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '10px', padding: '10px 16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <p style={{ fontWeight: 600, color: payload[0].payload.fill }}>{payload[0].name}</p>
        <p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatCarbon(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function Calculator() {
  const [inputs, setInputs] = useState({
    electricityKWh: 10,
    vehicleKm: 20,
    waterLitres: 150,
    foodType: 'mixed',
    plasticPerDay: 2,
  });

  const result = useMemo(() => calculateFootprint(inputs), [inputs]);

  const pieData = useMemo(() =>
    Object.entries(result.daily)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: parseFloat(value.toFixed(4)),
        fill: PIE_COLORS[key] || '#6B7280',
      })),
    [result]
  );

  const comparisonData = useMemo(() => [
    { name: 'You',       kg: parseFloat((result.annualTotal / 1000).toFixed(2)), fill: '#00C896' },
    { name: 'India Avg', kg: 1.9, fill: '#3B82F6' },
    { name: 'Global Avg',kg: 4.5, fill: '#F59E0B' }
  ], [result]);

  const sortedSources = [...pieData].sort((a, b) => b.value - a.value);
  const biggestSource = sortedSources[0] || null;
  const secondSource = sortedSources[1] || null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark-100)', padding: 'clamp(20px, 5vw, 40px) 0' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>
            Carbon Footprint <span className="gradient-text">Calculator</span>
          </h1>
          <p className="text-body" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Enter your daily habits and instantly see your carbon footprint breakdown.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {INPUT_CONFIG.map((cfg, i) => (
              <motion.div
                key={cfg.key}
                className="premium-card"
                style={{ padding: '24px' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: `${PIE_COLORS[cfg.key] || '#6B7280'}15`, color: PIE_COLORS[cfg.key],
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon name={cfg.icon} size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-card-title">{cfg.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.desc}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: PIE_COLORS[cfg.key], fontSize: '1.1rem', flexShrink: 0 }}>
                    {inputs[cfg.key]} {cfg.unit.split('/')[0]}
                  </div>
                </div>

                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={inputs[cfg.key]}
                  onChange={e => setInputs(inp => ({ ...inp, [cfg.key]: parseFloat(e.target.value) }))}
                  className="custom-slider"
                  style={{
                    width: '100%',
                    background: `linear-gradient(to right, ${PIE_COLORS[cfg.key] || 'var(--primary)'} ${((inputs[cfg.key] - cfg.min) / (cfg.max - cfg.min)) * 100}%, rgba(0,0,0,0.1) 0%)`,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cfg.min}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cfg.max} {cfg.unit}</span>
                </div>
              </motion.div>
            ))}

            {/* Food Selection */}
            <motion.div
              className="premium-card"
              style={{ padding: '24px' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="utensils" size={22} />
                </div>
                <div>
                  <div className="text-card-title">Food Consumption</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>What best describes your diet?</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {FOOD_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    onClick={() => setInputs(i => ({ ...i, foodType: opt.value }))}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '12px 10px', borderRadius: '12px', border: '1px solid',
                      borderColor: inputs.foodType === opt.value ? '#10B981' : 'rgba(0,0,0,0.1)',
                      background: inputs.foodType === opt.value ? '#DCFCE7' : '#F8FAFC',
                      color: inputs.foodType === opt.value ? '#10B981' : 'var(--text-muted)',
                      cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem',
                      fontWeight: inputs.foodType === opt.value ? 700 : 500, transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}><Icon name={opt.icon} size={20} /></div>
                    <div>{opt.label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>{opt.desc}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div
              className="premium-card"
              style={{ padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 32px)', textAlign: 'center' }}
              layout
            >
              {/* Risk Badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <motion.div
                  whileHover={{ y: -2, boxShadow: `0 8px 16px ${result.riskLevel.color}30` }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 18px', borderRadius: '10px',
                    background: `linear-gradient(145deg, ${result.riskLevel.bg}ee, ${result.riskLevel.bg}77)`,
                    backdropFilter: 'blur(8px)', color: result.riskLevel.color,
                    border: `1px solid ${result.riskLevel.color}40`,
                    borderTopColor: 'rgba(255,255,255,0.7)', borderLeftColor: 'rgba(255,255,255,0.7)',
                    fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.3px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ padding: '4px', background: `${result.riskLevel.color}15`, borderRadius: '6px', display: 'flex' }}>
                    <Icon name={result.riskLevel.icon} size={15} />
                  </div>
                  {result.riskLevel.level} Risk
                </motion.div>
              </div>

              {/* Big Number */}
              <motion.div
                key={result.dailyTotal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ fontSize: 'clamp(2.8rem, 8vw, 4.8rem)', fontWeight: 900, color: result.riskLevel.color, lineHeight: 1 }}
              >
                {result.dailyTotal.toFixed(2)}
              </motion.div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px', marginBottom: '28px', fontWeight: 500 }}>kg CO₂ per day</div>

              <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '20px' }} />

              {/* Annual Box */}
              <div style={{ padding: '20px', borderRadius: '14px', background: '#F8FAFC', marginBottom: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{result.annualTotal.toFixed(0)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>kg CO₂ per year &nbsp;({(result.annualTotal / 1000).toFixed(1)} tonnes)</div>
              </div>

              {/* Comparison pills */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '50px', background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>🌍 Global avg: 4.5T</span>
                <span style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '50px', background: '#DBEAFE', color: '#2563EB', fontWeight: 600 }}>🇮🇳 India avg: 1.9T</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* BOTTOM: Charts and Suggestions */}
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="bar-chart-2" size={20} color="var(--primary)" /> Your Detailed Breakdown
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Pie Chart */}
          <motion.div className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }} layout>
            <h3 className="text-card-title" style={{ marginBottom: '16px', textAlign: 'center' }}>
              Emissions Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} stroke="rgba(255,255,255,1)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.fill, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: d.fill }}>{formatCarbon(d.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Comparison Chart */}
          <motion.div className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }} layout>
            <h3 className="text-card-title" style={{ marginBottom: '16px', textAlign: 'center' }}>
              Annual Benchmark (Tonnes CO₂)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
                />
                <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Tips */}
          {biggestSource ? (
            <motion.div className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }} layout>
              <h3 className="text-card-title" style={{ marginBottom: '16px' }}>
                💡 Reduce {biggestSource.name} Impact
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                {(IMPROVEMENT_TIPS[biggestSource.name.toLowerCase()] || IMPROVEMENT_TIPS.electricity).map((tip, i) => (
                  <li key={i} className="text-body" style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                    <span style={{ color: '#FFFFFF', background: 'var(--primary)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0, marginTop: '3px' }}>✓</span> {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div className="premium-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }} layout>
              <p className="text-body" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Please adjust your inputs to see suggestions.</p>
            </motion.div>
          )}
          </div>

          {/* 2nd Source Prevention Card */}
          {secondSource && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ marginTop: '20px' }}
            >
              <div className="premium-card" style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎯</span>
                    Next Priority: Reduce <span style={{ color: secondSource.fill, marginLeft: '4px' }}>{secondSource.name}</span> Emissions
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <motion.div
                      whileHover={{ y: -2, boxShadow: `0 8px 16px ${secondSource.fill}30` }}
                      style={{
                        padding: '6px 14px', borderRadius: '8px',
                        background: `linear-gradient(145deg, ${secondSource.fill}15, ${secondSource.fill}08)`,
                        border: `1px solid ${secondSource.fill}30`,
                        borderTopColor: 'rgba(255,255,255,0.7)', borderLeftColor: 'rgba(255,255,255,0.7)',
                        color: secondSource.fill, fontSize: '0.82rem', fontWeight: 600,
                        backdropFilter: 'blur(8px)', letterSpacing: '0.3px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.3s ease'
                      }}
                    >
                      {formatCarbon(secondSource.value)}/day
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -2, boxShadow: '0 8px 16px rgba(16,185,129,0.15)' }}
                      style={{
                        padding: '6px 14px', borderRadius: '8px',
                        background: 'linear-gradient(145deg, rgba(230,251,240,0.8), rgba(209,250,229,0.4))',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderTopColor: 'rgba(255,255,255,0.7)', borderLeftColor: 'rgba(255,255,255,0.7)',
                        color: '#047857', fontSize: '0.82rem', fontWeight: 600,
                        backdropFilter: 'blur(8px)', letterSpacing: '0.3px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.3s ease'
                      }}
                    >
                      💚 Up to {CO2_SAVINGS[secondSource.name.toLowerCase()] || '0.5 kg CO₂/day saved'}
                    </motion.div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
                  {(IMPROVEMENT_TIPS[secondSource.name.toLowerCase()] || IMPROVEMENT_TIPS.electricity).map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                        padding: '12px 16px', borderRadius: '12px',
                        background: `${secondSource.fill}08`,
                        border: `1px solid ${secondSource.fill}20`,
                      }}
                    >
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                        background: secondSource.fill, color: '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, marginTop: '1px',
                      }}>✓</span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{tip}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
