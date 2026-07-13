export const PoisonBurstEffect = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      <div className="absolute inset-0 bg-purple-600 mix-blend-multiply opacity-30 animate-poisonFade" />

      <div 
        className="absolute bottom-10 left-[20%] w-8 h-8 bg-purple-500/80 rounded-full opacity-0 animate-poisonBubble shadow-sm border border-purple-400/30"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute bottom-10 left-[50%] w-12 h-12 bg-purple-600/80 rounded-full opacity-0 animate-poisonBubble shadow-sm border border-purple-500/30"
        style={{ animationDelay: '0.3s' }}
      />
      <div 
        className="absolute bottom-10 left-[80%] w-6 h-6 bg-purple-400/80 rounded-full opacity-0 animate-poisonBubble shadow-sm border border-purple-300/30"
        style={{ animationDelay: '0.6s' }}
      />
    </div>
  );
};