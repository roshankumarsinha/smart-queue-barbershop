/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Smart Queue barbershop design tokens
        charcoal: '#1B1512', // app background
        ivory: '#F3ECDF', // card / surface background
        'ivory-dim': '#E7DDC9', // input background
        brass: '#C89B3C', // primary accent / active states
        'brass-dark': '#A67C2E', // hover / pressed
        oxblood: '#7B2D2D', // secondary accent, barber-pole stripe
        ink: '#241A14', // text on ivory
        'ink-muted': '#6B5D4F', // secondary text
        error: '#B23A32',
        success: '#3F7A57',
      },
      fontFamily: {
        // Wordmark: bold, uppercase, wide-tracked serif
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        // Everything else: native system sans stack
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        // Continuously scrolls the diagonal barber-pole stripe by exactly one
        // tile (42px, matches .barber-stripe background-size) for a seamless loop.
        'barber-pole': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '42px 0' },
        },
        // Brief horizontal shake for invalid field submissions.
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        // Slow + subtle so it reads as a real rotating pole, not a candy stripe.
        'barber-pole': 'barber-pole 2.4s linear infinite',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
