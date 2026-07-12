export function PoisonBurstEffect() {
  const bubbles = Array.from({ length: 8 });

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {/* 画面全体が一瞬紫に染まるフラッシュ */}
      <div className="absolute inset-0 bg-purple-700/30 animate-poisonFlash" />

      {/* 立ちのぼる泡 */}
      {bubbles.map((_, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full bg-purple-400/70 animate-poisonBubble"
          style={{
            left: `${10 + i * 11}%`,
            width: `${8 + (i % 3) * 6}px`,
            height: `${8 + (i % 3) * 6}px`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}