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
        // 【修正】じわっと染まってから消える（名称もFadeに変更）
        poisonFade: {
          '0%': { opacity: '0' },
          '30%': { opacity: '0.25' },
          '70%': { opacity: '0.25' },
          '100%': { opacity: '0' },
        },
        // 【修正】ゆらゆら揺れながら上に昇る泡
        poisonBubble: {
          '0%': { transform: 'translate(0, 0) scale(0.5)', opacity: '0' },
          '20%': { transform: 'translate(-10px, -20px) scale(1)', opacity: '0.8' },
          '50%': { transform: 'translate(10px, -60px) scale(1.1)', opacity: '0.8' },
          '80%': { transform: 'translate(-10px, -100px) scale(1)', opacity: '0.4' },
          '100%': { transform: 'translate(0, -150px) scale(0.8)', opacity: '0' },
        },
      },
      animation: {
        popIn: 'popIn 0.4s ease-out',
        shake: 'shake 0.4s ease-in-out',
        poisonFade: 'poisonFade 3s ease-in-out forwards', // 3秒かけてじわっと
        poisonBubble: 'poisonBubble 2s ease-in-out forwards', // ゆらゆら昇る
      },
    },
  },
  plugins: [],
}