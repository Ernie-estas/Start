/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary':    '#080a0f',
        'bg-secondary':  '#0d0f14',
        'bg-card':       '#0f1117',
        'bg-hover':      '#161822',
        'border-subtle': '#1f2333',
        'border-default':'#2a2f45',
        'text-primary':  '#e2e8f0',
        'text-secondary':'#94a3b8',
        'text-muted':    '#4b5563',
        'accent-blue':   '#3b82f6',
        'accent-cyan':   '#06b6d4',
        'accent-green':  '#10b981',
        'accent-red':    '#ef4444',
        'accent-amber':  '#f59e0b',
        'accent-purple': '#8b5cf6',
      },
      boxShadow: {
        'card':       '0 4px 16px rgba(0,0,0,0.45)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.6)',
        'glow-blue':  '0 0 20px rgba(59,130,246,0.18)',
        'glow-green': '0 0 20px rgba(16,185,129,0.18)',
        'glow-red':   '0 0 20px rgba(239,68,68,0.15)',
      },
      animation: {
        'ticker':   'ticker 35s linear infinite',
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-dot':'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
}
