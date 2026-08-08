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
          primary:      '#5B4A3B',  // dark cocoa — headings, prices, prominent text
          secondary:    '#6B6257',  // soft brown — body copy, secondary text
          light:        '#D7C7AE',  // sandstone beige — borders, dividers
          bg:           '#FAF3E6',  // soft ivory — page background
          white:        '#EDE3D1',  // light beige — cards, panels
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
