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
          primary:      '#4A3A2C',  // deep cocoa — headings, prices, prominent text (darker for max readability)
          secondary:    '#5B5245',  // richer brown — body copy, secondary text
          light:        '#D7C7AE',  // sandstone beige — borders, dividers
          bg:           '#FAF3E6',  // soft ivory — page background
          white:        '#FDFAF3',  // near-white with warm cast — cards (high contrast for text)
          cream:        '#F5EAD5',  // lighter beige — accent panels, subtle bg
          blush:        '#EDDBC7',  // warm beige — hover backgrounds
          accent:       '#C97B63',  // terracotta — primary buttons, CTAs
          accentHover:  '#A85E46',  // deep clay — button hover state
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
