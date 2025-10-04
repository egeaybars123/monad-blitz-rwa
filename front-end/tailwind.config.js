import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'monad-black': '#0E100F',
        'monad-blue': '#200052',
        'monad-berry': '#A0055D',
        'monad-purple': '#836EF9',
        'monad-offwhite': '#FBFAF9'
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 38px rgba(160,5,93,0.28)'
      }
    }
  },
  plugins: [forms, typography]
};
