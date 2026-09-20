/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--bg)',
        ink: 'var(--text)',
        'ink-soft': 'var(--muted)',
        line: 'var(--border)',
        sidebar: 'var(--sidebar)',
        alert: 'var(--danger)',
        security: 'var(--security)',
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          soft: 'var(--soft-blue)',
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '.55' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .5s ease-out both',
        drift: 'drift 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}