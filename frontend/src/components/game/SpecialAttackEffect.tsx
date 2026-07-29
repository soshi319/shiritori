// 一閃（キャラA）／各キャラの必殺技が命中した瞬間に表示するフラッシュ演出。
// gameRoom.ts の TURN_RESULT で isBakudan && effect.type === 'hit' の時にだけ発火させる想定。

export type SpecialAttackEffectData = {
  id: number; // 発生ごとに違う値にすることで、同じ演出が連続で来ても毎回アニメーションし直させる
  label: string; // 例: "一閃!!" / "鉄壁の盾!!"
  themeColor: string; // 発動したキャラの themeColor
};

type SpecialAttackEffectProps = {
  data: SpecialAttackEffectData | null;
};

export function SpecialAttackEffect({ data }: SpecialAttackEffectProps) {
  if (!data) return null;

  return (
    <div
      key={data.id}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden"
    >
      <style>{`
        @keyframes saeFlash {
          0% { opacity: 0; }
          15% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes saeSlash {
          0% { transform: translateX(-130%) rotate(-16deg) scaleX(0.3); opacity: 0; }
          25% { opacity: 1; }
          55% { transform: translateX(15%) rotate(-16deg) scaleX(1.5); opacity: 1; }
          100% { transform: translateX(150%) rotate(-16deg) scaleX(1.5); opacity: 0; }
        }
        @keyframes saeLabelPop {
          0% { opacity: 0; transform: scale(0.4) rotate(-6deg); }
          40% { opacity: 1; transform: scale(1.15) rotate(2deg); }
          65% { transform: scale(1) rotate(0deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .sae-flash { animation: saeFlash 0.35s ease-out forwards; }
        .sae-slash { animation: saeSlash 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .sae-label { animation: saeLabelPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
      `}</style>

      <div className="sae-flash absolute inset-0 bg-white" />

      <div
        className="sae-slash absolute h-3 w-[70%] rounded-full"
        style={{
          background:
            `linear-gradient(90deg, transparent, ${data.themeColor}, white, ${data.themeColor}, transparent)`,
          boxShadow: `0 0 30px 8px ${data.themeColor}`,
        }}
      />

      <span
        className="sae-label relative text-5xl sm:text-7xl font-black tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] text-center px-4"
        style={{ color: data.themeColor, WebkitTextStroke: '3px white' }}
      >
        {data.label}
      </span>
    </div>
  );
}
