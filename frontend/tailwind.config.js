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
        /* Bleu principal SailingLoc */
        'brand-blue': '#2563FF',
        /* slate plus sombre : meilleur contraste WCAG sur fond clair (~7:1) */
        'brand-slate': '#1e293b',
        'brand-teal': '#006875',
        'brand-dark': '#0A1120',
        /* muted relevé : ~4.6:1 sur blanc (AA textes secondaires) */
        'brand-muted': '#64748b',
        ocean: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563FF',
          600: '#1D4ED8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0b1228',
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
