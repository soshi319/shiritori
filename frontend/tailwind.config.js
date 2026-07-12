/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
        // 【追加】画面が一瞬紫に染まって消える
        poisonFlash: {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // 【追加】泡が下から上に立ちのぼりながら消える
        poisonBubble: {
          '0%': { transform: 'translateY(0)', opacity: '0.8' },
          '100%': { transform: 'translateY(-300px)', opacity: '0' },
        },
      },
      animation: {
        popIn: 'popIn 0.4s ease-out',
        shake: 'shake 0.4s ease-in-out',
        poisonFlash: 'poisonFlash 0.8s ease-out', // 【追加】
        poisonBubble: 'poisonBubble 1.6s ease-out forwards', // 【追加】
      },
    },
  },
  plugins: [],
}