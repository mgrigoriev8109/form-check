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
          DEFAULT: '#1e293b', // Deep Slate
          light: '#334155',
          dark: '#0f172a',
        },
        secondary: {
          DEFAULT: '#22c55e', // Sage Green
          light: '#4ade80',
          dark: '#16a34a',
        },
        accent: {
          DEFAULT: '#f59e0b', // Warm Amber
          light: '#fbbf24',
          dark: '#d97706',
        },
        neutral: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
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