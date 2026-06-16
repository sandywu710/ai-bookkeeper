import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAF7F2',
        'text-main': '#2C2019',
        'text-sub': '#8B7355',
        primary: '#4CAF7D',
        accent: '#F5A623',
        danger: '#E8736C',
        card: '#FFFFFF',
        border: '#E8E0D5',
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(44,32,25,0.06)',
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
}

export default config
