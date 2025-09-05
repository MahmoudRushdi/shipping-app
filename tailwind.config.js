/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // RTL support
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [
    // RTL support plugin
    function({ addUtilities, theme }) {
      const rtlUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        // RTL specific spacing utilities
        '.rtl .ml-auto': {
          marginLeft: 'unset',
          marginRight: 'auto',
        },
        '.ltr .mr-auto': {
          marginRight: 'unset',
          marginLeft: 'auto',
        },
        // RTL specific text alignment
        '.rtl .text-left': {
          textAlign: 'right',
        },
        '.ltr .text-right': {
          textAlign: 'left',
        },
        // RTL specific flex directions
        '.rtl .flex-row': {
          flexDirection: 'row-reverse',
        },
        '.ltr .flex-row-reverse': {
          flexDirection: 'row',
        },
      };
      addUtilities(rtlUtilities);
    },
  ],
}
