/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0E1A',
          soft: '#131826',
          line: '#1F2638',
          mute: '#2A3147',
        },
        fg: {
          DEFAULT: '#F5F7FF',
          dim: '#B7BFD5',
          mute: '#7B8298',
        },
        accent: {
          cyan: '#00E5FF',
          violet: '#8B5CF6',
          magenta: '#FF2D92',
          amber: '#FFB020',
        },
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 229, 255, 0.35)',
        'glow-soft': '0 0 12px rgba(0, 229, 255, 0.2)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 220ms ease-out',
        'rise-in': 'riseIn 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
