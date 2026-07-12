type ComboBurstEffectProps = {
  comboCount: number;
};

export function ComboBurstEffect({ comboCount }: ComboBurstEffectProps) {
  const comboStyle: React.CSSProperties = {
    fontFamily: "'Titan One', sans-serif",
    WebkitTextStroke: '2px #7c2d12', 
    letterSpacing: '0.03em',
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-popIn pointer-events-none flex items-baseline gap-2">
      <span
        className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 text-5xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
        style={comboStyle}
      >
        COMBO!
      </span>
      <span
        className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 text-4xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
        style={comboStyle}
      >
        ×{comboCount}
      </span>
    </div>
  );
}