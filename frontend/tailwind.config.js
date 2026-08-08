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
        // Warm highlight used for the brass "gleam" and hairline accents.
        'brass-light': '#E7C56B',
      },
      fontFamily: {
        // Wordmark + big headings: Bebas Neue, the classic condensed
        // barbershop-signage face. Falls back to a condensed system stack.
        display: [
          '"Bebas Neue"',
          '"Oswald"',
          '"Arial Narrow"',
          'Impact',
          'sans-serif',
        ],
        // Medium-weight all-caps labels / buttons.
        signage: ['"Oswald"', '"Arial Narrow"', 'sans-serif'],
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
        // Brass "gleam": a conic spark that travels the button perimeter.
        // (Technique adapted from the 21st.dev / magicui Shimmer Button, tuned
        // to the brass palette.)
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
        // Soft "breathing" brass glow around the now-serving card.
        'serving-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200,155,60,0.0)' },
          '50%': { boxShadow: '0 0 26px 2px rgba(200,155,60,0.35)' },
        },
      },
      animation: {
        // Slow + subtle so it reads as a real rotating pole, not a candy stripe.
        'barber-pole': 'barber-pole 2.4s linear infinite',
        shake: 'shake 0.4s ease-in-out',
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
        'serving-pulse': 'serving-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
