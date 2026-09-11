/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0B0D10',
        surface: '#13161A',
        line: '#23272E',
        ink: '#ECE8DE',
        muted: '#8A8F98',
        amber: '#E8A33D',
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
