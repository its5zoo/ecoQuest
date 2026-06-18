/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e6fff8',
          100: '#b3ffe9',
          200: '#80ffd9',
          300: '#4dffca',
          400: '#1affba',
          500: '#00C896',
          600: '#00a87d',
          700: '#008864',
          800: '#00684b',
          900: '#004832',
        },
        accent: '#4ADE80',
        warning: '#F59E0B',
        danger:  '#EF4444',
        dark: {
          DEFAULT: '#0A0F0D',
          100: '#0F1A14',
          200: '#152219',
          300: '#1B2B20',
          400: '#223428',
        },
        glass: 'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body:    ['Inter',   'sans-serif'],
        accent:  ['DM Sans', 'sans-serif'],
        sans:    ['Inter',   'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero':    ['clamp(3rem,8vw,6rem)',   { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display': ['clamp(2.5rem,5vw,4rem)', { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'section': ['clamp(2rem,4vw,3rem)',   { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '700' }],
        'stat':    ['clamp(2.5rem,5vw,3.5rem)', { lineHeight: '1',  letterSpacing: '-0.02em', fontWeight: '800' }],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0A0F0D 0%, #0F2D1A 50%, #0A0F0D 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(0,200,150,0.1), rgba(74,222,128,0.05))',
        'glow-gradient': 'radial-gradient(ellipse at center, rgba(0,200,150,0.15) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'spin-slow': 'spin 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'particle': 'particle 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(0,200,150,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0,200,150,0.8), 0 0 40px rgba(0,200,150,0.4)' },
        },
        particle: {
          '0%':   { transform: 'translateY(100vh) rotate(0deg)', opacity: 0 },
          '10%':  { opacity: 1 },
          '90%':  { opacity: 1 },
          '100%': { transform: 'translateY(-100px) rotate(360deg)', opacity: 0 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow':      '0 0 20px rgba(0,200,150,0.3)',
        'glow-lg':   '0 0 40px rgba(0,200,150,0.4)',
        'glow-red':  '0 0 20px rgba(239,68,68,0.3)',
        'card':      '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover':'0 16px 48px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
