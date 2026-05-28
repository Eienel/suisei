/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm-dark surface (quest app). Not pure black; navy/brown undertone.
        night: {
          DEFAULT: '#15171F',
          soft: '#1E2129',
          deep: '#0F1117',
          line: '#2C2F3A',
          mute: '#3A3E4B',
        },
        // Cream surface (landing + MCP docs). Warm off-white, not paper white.
        paper: {
          DEFAULT: '#F2EBDC',
          soft: '#F6F0E3',
          deep: '#E8DFCB',
          line: '#DCD1B7',
          mute: '#C9BCA0',
        },
        // Ink (foreground on cream)
        ink: {
          DEFAULT: '#16171C',
          dim: '#5A5A66',
          mute: '#8B8B9A',
        },
        // Cream (foreground on warm-dark)
        cream: {
          DEFAULT: '#F2EBDC',
          dim: '#B5AD9D',
          mute: '#7F786C',
        },
        // Spot accents (Earth + sage palette). One color per role.
        terracotta: '#D7552E',
        butter: '#E6B23A',
        sage: '#7FA88E',
        'ink-navy': '#1E3A8A',
      },
      fontFamily: {
        // Apple system first (SF Pro on macOS / iOS / iPadOS), Geist as
        // cross-platform fallback, then native system stack.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Geist Sans"',
          '"Inter"',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Geist Sans"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          '"SF Mono"',
          '"Geist Mono"',
          'Menlo',
          'monospace',
        ],
      },
      borderRadius: {
        // Apple-style pills + cards
        pill: '999px',
        card: '22px',
      },
      boxShadow: {
        // Cream surface depth (Apple-style, no gradients)
        'paper-card': '0 1px 0 rgba(26, 26, 31, 0.04), 0 8px 24px rgba(26, 26, 31, 0.06)',
        'paper-lift': '0 2px 0 rgba(26, 26, 31, 0.05), 0 16px 40px rgba(26, 26, 31, 0.08)',
        // Warm-dark surface depth
        'night-card': '0 1px 0 rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.3)',
        'night-lift': '0 2px 0 rgba(0, 0, 0, 0.45), 0 20px 48px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        // SVG grain overlays. Tile is 200x200, rendered at 0.04 alpha for
        // dark surface, 0.06 for cream (paper feels more textured).
        'grain-night':
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        'grain-paper':
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      animation: {
        'fade-in': 'fadeIn 220ms ease-out',
        'rise-in': 'riseIn 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        caret: 'caret 1s steps(1) infinite',
        'grain-in': 'grainIn 170ms ease-out',
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
        caret: {
          '0%, 50%': { opacity: '1' },
          '50.01%, 100%': { opacity: '0' },
        },
        grainIn: {
          '0%': {
            opacity: '0',
            filter: 'blur(3px)',
            transform: 'translateY(-1px)',
          },
          '60%': { opacity: '1', filter: 'blur(0.4px)' },
          '100%': { filter: 'blur(0)', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
