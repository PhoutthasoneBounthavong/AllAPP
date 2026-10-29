/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          blue: "#0071E3",
          darkblue: "#0051A8",
          gray: {
            50: "#F5F5F7",
            100: "#E5E5EA",
            200: "#D1D1D6",
            300: "#C7C7CC",
            400: "#AEAEB2",
            500: "#8E8E93",
            600: "#636366",
            700: "#48484A",
            800: "#2C2C2E",
            900: "#1C1C1E",
            950: "#000000",
          }
        }
      },
      fontFamily: {
        sf: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        'apple-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
        'apple-md': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 12px 24px -4px rgba(0, 0, 0, 0.06)',
        'apple-card': '0 30px 60px rgba(0,0,0,0.18), 0 0 1px 1px rgba(255,255,255,0.2) inset',
      },
      borderRadius: {
        'apple-sm': '10px',
        'apple-md': '14px',
        'apple-lg': '20px',
        'apple-xl': '28px',
        'apple-2xl': '36px',
      }
    },
  },
  plugins: [],
}
