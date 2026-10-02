/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
      },
      colors: {
        apple: {
          bg: '#F5F5F7',
          dark: '#1D1D1F',
          gray: '#86868B',
          blue: '#0071E3',
          lightBlue: '#EBF5FF',
          card: '#FFFFFF',
          footer: '#F9F9FB',
        },
      },
      boxShadow: {
        apple: '0 4px 24px rgba(0, 0, 0, 0.06)',
        'apple-hover': '0 8px 32px rgba(0, 0, 0, 0.1)',
        modal: '0 24px 64px rgba(0, 0, 0, 0.15)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'ping-dot': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        heroReveal: {
          '0%': { opacity: '0', transform: 'translateY(30px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        cardEnter: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        heroImageIn: {
          '0%': { transform: 'scale(1.15)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        'ping-dot': 'ping-dot 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
        'hero-reveal': 'heroReveal 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'card-enter': 'cardEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'hero-image-in': 'heroImageIn 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'marquee': 'marquee 45s linear infinite',
      },
    },
  },
  plugins: [],
}
