/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          alabaster: '#FBFBFA',
          sand: '#F5F2EB',
          oatmeal: '#EFECE6',
          clay: '#D4CFC5',
          charcoal: '#1A1A1A',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
