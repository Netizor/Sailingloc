/** @type {import('tailwindcss').Config} */
export default {
  // Activation du mode sombre via la classe CSS sur <html>.
  // On utilise le format '.dark &' (classique) plutôt que 'class' (qui génère
  // ':is(.dark *)' en Tailwind v3.4 — incompatible avec certains navigateurs/configs).
  darkMode: ['variant', '.dark &'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#003366',
        'brand-blue': '#2563FF',
        'brand-slate': '#334155',
        'brand-teal': '#006875',
        'brand-dark': '#0A1120',
        'brand-muted': '#8A94A6',
        ocean: {
          50: '#eef3fb',
          100: '#d6e4f5',
          200: '#adc9eb',
          300: '#7aa3db',
          400: '#4d7fc9',
          500: '#2563FF',
          600: '#1a4fcc',
          700: '#003366',
          800: '#002952',
          900: '#001a33',
          950: '#000d1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
