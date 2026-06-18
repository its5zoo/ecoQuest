import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Home',        path: '/'           },
    { label: 'Tracker',     path: '/tracker'    },
    { label: 'Calculator',  path: '/calculator' },
    { label: 'News',        path: '/news'       },
    { label: 'Profile',     path: '/profile'    },
  ],
  Company: [
    { label: 'About Us',      path: '#' },
    { label: 'Our Mission',   path: '#' },
    { label: 'Blog',          path: '#' },
    { label: 'Careers',       path: '#' },
    { label: 'Press',         path: '#' },
  ],
  Resources: [
    { label: 'Carbon Facts',       path: '#' },
    { label: 'Climate Reports',    path: '#' },
    { label: 'Reduction Tips',     path: '#' },
    { label: 'API Docs',           path: '#' },
    { label: 'Help Center',        path: '#' },
  ],
};

const STATS = [
  { value: '2.4M+', label: 'Users Tracking' },
  { value: '18K',   label: 'Tonnes CO₂ Saved' },
  { value: '150+',  label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-dark)',
      borderTop: '1px solid rgba(0, 0, 0, 0.05)',
      paddingTop: '60px',
    }}>
      {/* Stats Bar */}
      <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', paddingBottom: '40px', marginBottom: '50px' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '24px', textAlign: 'center' }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, background: 'var(--primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '50px' }}>
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>🌿</div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                EcoQuest
              </span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '20px', maxWidth: '220px' }}>
              Track your carbon footprint, build eco-friendly habits, and help save the planet — one action at a time.
            </p>
            {/* Newsletter */}
            <div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>Stay Updated</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="input-field"
                  style={{ flex: '1 1 160px', minWidth: 0, padding: '9px 12px', fontSize: '0.85rem' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary"
                  style={{ padding: '9px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap', flex: '0 0 auto' }}
                >
                  <span>Subscribe</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
                {title}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      style={{
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          paddingTop: '24px',
          paddingBottom: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} EcoQuest. All rights reserved. Designed & Developed with 💚 by <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>MD Faizaan Raza Khan</strong> for the planet.
          </p>

          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <a key={item} href="#" style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
