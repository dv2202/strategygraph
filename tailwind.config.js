/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize:{
        base:'12px'
      },
      fontFamily:{
        'gra':['Graphik', 'sans-serif'],
      }
    },
    colors: {
      "P150":"#12B16E",
      "Red" :"#E94C69",
      "Blue":"#0075FF",
      "N-500":"#878787",
      "N-100":"#EBEBEB",
      "P300":"#0F0F0F",
      "P400":"#FFFFFF",
      "N-000":"#F3F3F3",
      "N200":"#CFCFCF",
      "N400":"#9F9F9F",
      "N-600":"#6F6F6F",
      "primary":"#FAFDFD"
    },
  },
  plugins: [],
}

