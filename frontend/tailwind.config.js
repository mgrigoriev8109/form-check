/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color names for easy theme switching
        primary: {
          DEFAULT: '#166534', // Deep Forest Green
          light: '#16a34a',
          dark: '#14532d',
        },
        secondary: {
          DEFAULT: '#f43f5e', // Vibrant Coral/Rose
          light: '#fb7185',
          dark: '#e11d48',
        },
        accent: {
          DEFAULT: '#fbbf24', // Golden Amber
          light: '#fcd34d',
          dark: '#f59e0b',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
        },
        error: {
          DEFAULT: '#dc2626',
          light: '#ef4444',
          dark: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
}