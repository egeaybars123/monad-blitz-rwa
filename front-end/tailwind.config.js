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
        'monad-offwhite': '#FBFAF9',
        xpBlue: '#245edb',
        xpBlueDark: '#0b3b9e',
        xpBlueLight: '#54a2ff',
        xpCream: '#f2f5fc',
        xpYellow: '#fdd868',
        xpGray: '#d4d0c8',
        xpGrayDark: '#9a9a9a'
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        xp: ['Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 38px rgba(160,5,93,0.28)',
        xpWindow: 'inset 0 0 0 1px rgba(255,255,255,0.55), inset 0 0 0 2px rgba(0,0,0,0.25)',
        xpRaised: '0 2px 6px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: [forms, typography]
};
