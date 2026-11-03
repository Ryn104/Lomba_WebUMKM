/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        surface: {
          app: '#F8FAFC',
          card: '#FFFFFF',
          muted: '#F1F5F9',
        },
        border: {
          subtle: '#E2E8F0',
          strong: '#CBD5E1',
        },
        status: {
          'success-text': '#166534',
          'success-bg': '#DCFCE7',
          'warning-text': '#92400E',
          'warning-bg': '#FEF3C7',
          'danger-text': '#991B1B',
          'danger-bg': '#FEE2E2',
          'info-text': '#1D4ED8',
          'info-bg': '#DBEAFE',
          'neutral-text': '#334155',
          'neutral-bg': '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
