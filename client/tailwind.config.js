/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef2fb', 100: '#d7e0f5', 500: '#2a4a8a', 600: '#1f3a73', 700: '#172c59', 800: '#0f1f40', 900: '#0a1630' },
        brand: { DEFAULT: '#1f3a73', accent: '#f5b82e' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
      animation: { fadeUp: 'fadeUp .5s ease-out both', slideIn: 'slideIn .3s ease-out both' },
    },
  },
  plugins: [],
};
