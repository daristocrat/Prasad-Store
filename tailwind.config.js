/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  '#f97316',  // orange-500 — buttons, links, accents
          dark:     '#ea580c',  // orange-600 — hover states
          deeper:   '#c2410c',  // orange-700 — dark panels
          darkest:  '#431407',  // orange-950 — footer / hero
          light:    '#fff7ed',  // orange-50  — card tints
          mid:      '#fed7aa',  // orange-200 — borders / dividers
          green:    '#16a34a',  // keep for In Stock / savings badges
          greenLight: '#f0fdf4'
        }
      },
      boxShadow: {
        soft: '0 14px 35px rgba(249, 115, 22, 0.15)',
        card: '0 4px 16px rgba(15, 23, 42, 0.07)'
      },
      backgroundImage: {
        'brand-hero':    'linear-gradient(135deg, #431407 0%, #c2410c 60%, #f97316 100%)',
        'brand-section': 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
        'brand-strip':   'linear-gradient(90deg,  #c2410c 0%, #f97316 100%)'
      }
    }
  },
  plugins: []
};
