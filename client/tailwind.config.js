/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Neon Blue Primary - Electric and Modern
        primary: {
          50: '#e6f7ff',
          100: '#bae7ff',
          200: '#7dd3fc',
          300: '#38bdf8',
          400: '#0ea5e9', // Main neon blue
          500: '#0088ff', // Electric blue
          600: '#006dd4',
          700: '#0052a3',
          800: '#003d7a',
          900: '#002952',
        },
        // Dark Blue Secondary - Deep and Professional
        secondary: {
          50: '#f0f8ff',
          100: '#e0efff',
          200: '#c7dfff',
          300: '#a6ccff',
          400: '#7db3ff',
          500: '#4d94ff',
          600: '#1e3a8a', // Deep blue
          700: '#1a365d',
          800: '#152b47',
          900: '#0f1419', // Almost black blue
        },
        // Cyan Accent - Fresh and Energetic
        accent: {
          50: '#f0fdff',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#00d4ff', // Bright cyan
          600: '#00a8cc',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Cool Gray - Balanced Neutrals
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Success Green - Subtle and Harmonious
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80', // Success green
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Footer Blue - Even Darker
        footer: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#1e293b',
          800: '#0f172a',
          900: '#020617', // Ultra dark blue
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #002952 100%)',
        'neon-gradient': 'linear-gradient(135deg, #0088ff 0%, #00d4ff 100%)',
        'dark-blue-gradient': 'linear-gradient(135deg, #0f1419 0%, #152b47 50%, #1e3a8a 100%)',
        'electric-gradient': 'linear-gradient(45deg, #0088ff 0%, #00d4ff 50%, #0ea5e9 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} 