/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#16843a',
          deep: '#0f5f2e',
          light: '#ecfdf3',
          orange: '#f97316',
          amber: '#fff7ed'
        },
        ink: '#17231d'
      },
      boxShadow: {
        soft: '0 14px 35px rgba(21, 128, 61, 0.12)',
        card: '0 12px 28px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
