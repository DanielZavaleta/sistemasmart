/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "node_modules/flowbite-react/lib/esm/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        'primary': ['Nunito', 'sans-serif'],
        'secondary': ['Poppins', 'sans-serif'],
      },
      colors: {
        'primary': '#FE9F43',
        'primary-hover': '#fe8d1f',
        'secondary': '#092C4C',
        'secondary-hover': '#051a2c',
        'success': '#3EB780',
        'success-hover': '#359c6d',
        'info': '#155EEF',
        'info-hover': '#0e50d2',
        'warning': '#FFCA18',
        'warning-hover': '#f3bb00',
        'danger': '#FF0000',
        'danger-hover': '#db0000',
        'dark': '#1B2850',
        'light': '#F9FAFB',
        'sidebar-bg': '#FFFFFF',
      }
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}