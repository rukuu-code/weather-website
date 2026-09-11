/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        bg2: '#141B33',
        surface: '#151B2E',
        line: '#262E4A',
        ink: '#E9ECF5',
        muted: '#8890A8',
        accent: '#7C9CFF',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        content: '560px',
      },
    },
  },
  plugins: [],
}
