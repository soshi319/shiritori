// ばくだん（必殺技）の条件を満たせず自滅した瞬間（gameOverReason === 'bakudan_failed'）に表示する爆発演出。

export type SelfDestructEffectData = {
  id: number; // 発生ごとに違う値にすることで、毎回アニメーションし直させる
};

type SelfDestructEffectProps = {
  data: SelfDestructEffectData | null;
};

export function SelfDestructEffect({ data }: SelfDestructEffectProps) {
  if (!data) return null;

  return (
    <div
      key={data.id}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden"
    >
      <style>{`
        @keyframes sdFlash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes sdShockwave {
          0% { transform: scale(0.2); opacity: 0.9; border-width: 14px; }
          100% { transform: scale(3.4); opacity: 0; border-width: 1px; }
        }
        @keyframes sdLabel {
          0% { opacity: 0; transform: translateY(10px) scale(0.7); }
          30% { opacity: 1; transform: translateY(0) scale(1.15); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sd-flash { animation: sdFlash 0.4s ease-out forwards; }
        .sd-shockwave { animation: sdShockwave 0.7s ease-out forwards; }
        .sd-label { animation: sdLabel 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
      `}</style>

      <div className="sd-flash absolute inset-0 bg-orange-100" />

      <div
        className="sd-shockwave absolute w-24 h-24 rounded-full border-solid border-orange-500"
      />
      <div
        className="sd-shockwave absolute w-24 h-24 rounded-full border-solid border-red-600"
        style={{ animationDelay: '0.12s' }}
      />

      <span
        className="sd-label relative text-4xl sm:text-6xl font-black text-red-700 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
        style={{ WebkitTextStroke: '2px white' }}
      >
        自爆…！
      </span>
    </div>
  );
}
