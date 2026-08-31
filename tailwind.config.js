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
          DEFAULT: '#0369a1',
          hover: '#075985',
          light: '#e0f2fe',
          soft: '#f0f9ff',
          dark: '#0c4a6e',
        },
        success: {
          DEFAULT: '#059669',
          light: '#ecfdf5',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fffbeb',
          dark: '#b45309',
        },
        danger: {
          DEFAULT: '#dc2626',
          light: '#fef2f2',
          dark: '#b91c1c',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
          light: '#94a3b8',
        },
      },
      fontFamily: {
        // একটিই টাইপফেস — বাংলা লেখা ও বাংলা অঙ্ক (০-৯, ৳) সব একই ফন্টে।
        sans: ['Hind Siliguri', 'Inter', 'Nirmala UI', 'SolaimanLipi', 'Segoe UI', 'sans-serif'],
        display: ['Hind Siliguri', 'Inter', 'Nirmala UI', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
    },
  },
  plugins: [],
}
