/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0f172a', 950: '#020617' },
        gold: { 500: '#d4af37', 600: '#b8860b' },
      },
    },
  },
  plugins: [],
};
