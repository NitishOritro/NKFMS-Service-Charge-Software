/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284c7',
          hover: '#0369a1',
          light: '#e0f2fe',
          dark: '#075985',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#ecfdf5',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#b45309',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fef2f2',
          dark: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Hind Siliguri', 'Inter', 'sans-serif'],
        display: ['Outfit', 'Hind Siliguri', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
