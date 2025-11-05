/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        indigo: 'var(--ovii-indigo)',
        gold: 'var(--ovii-gold)',
        mint: 'var(--ovii-mint)',
        coral: 'var(--ovii-coral)',
        white: 'var(--ovii-off-white)',
      },
    },
  },
  plugins: [],
};

export default config;