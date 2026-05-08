/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E6BFF',
          'blue-dark': '#1450C7',
          'blue-light': '#5C95FF',
          yellow: '#FFC83D',
          'yellow-dark': '#E0A91A',
          cream: '#FAF7F2',
          ink: '#1A1F2E',
          'ink-soft': '#3D4555',
        },
      },
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brick: '0 4px 0 rgba(0,0,0,0.18), 0 6px 18px rgba(0,0,0,0.12)',
        'brick-lg': '0 6px 0 rgba(0,0,0,0.2), 0 12px 30px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        brick: '12px',
      },
    },
  },
  plugins: [],
};
