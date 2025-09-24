/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        textSecondary: 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(158, 127, 255, 0.4)', // Primary color glow
      },
      animation: {
        'fade-in-up': 'fadeInFromBottom 0.8s ease-out forwards',
      },
      keyframes: {
        fadeInFromBottom: {
          'from': { opacity: 0, transform: 'translateY(20px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
