/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#136C66',
      },
      boxShadow: {
        custom: "0px 0px 6px 0px rgba(0, 0, 0, 0.20)",
      },
      fontFamily: {
        bold: ['Ozone Bd', 'sans-serif'], // Add Ozone Bd as the font for bold text
        semibold: ['Ozone Med', 'sans-serif'], 
      },
    },
  },
  plugins: [],
};
