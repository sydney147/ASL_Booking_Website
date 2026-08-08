import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:   '#41224A',  // deep purple — logo, headings, primary buttons
          secondary: '#8B6EAA',  // soft lavender — accents, links, secondary text
          light:     '#E8DEF7',  // pale lavender — borders, dividers, subtle bg
          bg:        '#FFF8F3',  // warm cream — page background
          white:     '#FEFCFA',  // faint cream-white — cards
          cream:     '#FFF0E4',  // deeper cream — accent panels, tags
          blush:     '#F7E4EE',  // light blush — hover/subtle accent
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
