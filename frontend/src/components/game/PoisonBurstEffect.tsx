export const PoisonBurstEffect = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 画面全体をじわっと紫にする背景 */}
      <div className="absolute inset-0 bg-purple-500 mix-blend-multiply animate-poisonFade" />

      {/* 湧き上がる泡（複数用意して位置と遅延をズラす） */}
      <div 
        className="absolute bottom-10 left-[20%] w-8 h-8 bg-purple-400 rounded-full opacity-0 animate-poisonBubble"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute bottom-10 left-[50%] w-12 h-12 bg-purple-500 rounded-full opacity-0 animate-poisonBubble"
        style={{ animationDelay: '0.3s' }}
      />
      <div 
        className="absolute bottom-10 left-[80%] w-6 h-6 bg-purple-300 rounded-full opacity-0 animate-poisonBubble"
        style={{ animationDelay: '0.6s' }}
      />
    </div>
  );
};