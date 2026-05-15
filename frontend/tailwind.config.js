/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue:   '#00d4ff',
          purple: '#7c3aed',
          pink:   '#ff00ff',
          green:  '#00e676',
          orange: '#ff9500',
          red:    '#ff4444',
          gold:   '#ffd700',
        },
        dark: {
          900: '#020712',
          800: '#050a14',
          700: '#080f1e',
          600: '#0d1628',
          500: '#111e35',
          400: '#1a2d4d',
          300: '#243a5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-neon':  'pulseNeon 2s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'scan':        'scan 3s linear infinite',
        'glow-ring':   'glowRing 2s ease-in-out infinite',
        'slide-in':    'slideIn 0.4s ease-out',
        'fade-in':     'fadeIn 0.5s ease-out',
        'spin-slow':   'spin 8s linear infinite',
        'data-stream': 'dataStream 1.5s linear infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #00d4ff, 0 0 20px #00d4ff44' },
          '50%':      { boxShadow: '0 0 20px #00d4ff, 0 0 60px #00d4ff66' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glowRing: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        dataStream: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 40px' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
