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
        /* Bleu mer (moins électrique que #2563FF) */
        'brand-blue': '#1A6FA8',
        /* slate plus sombre : meilleur contraste WCAG sur fond clair (~7:1) */
        'brand-slate': '#1e293b',
        'brand-teal': '#006875',
        'brand-dark': '#0A1120',
        /* muted relevé : ~4.6:1 sur blanc (AA textes secondaires) */
        'brand-muted': '#64748b',
        ocean: {
          50: '#eef3fb',
          100: '#d6e4f5',
          200: '#adc9eb',
          300: '#7aa3db',
          400: '#4d8fb8',
          500: '#1A6FA8',
          600: '#155A8A',
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
