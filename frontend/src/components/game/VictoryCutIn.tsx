import { characters } from 'shared/data/characters';

// 決着（GAME_OVER）の瞬間、結果画面を表示する前に一瞬挟む勝者カットイン演出。

export type VictoryCutInData = {
  id: number; // 発生ごとに違う値にすることで、毎回アニメーションし直させる
  characterId: string;
  playerName: string;
};

type VictoryCutInProps = {
  data: VictoryCutInData | null;
};

export function VictoryCutIn({ data }: VictoryCutInProps) {
  if (!data) return null;

  const character = characters.find((c) => c.id === data.characterId) ?? characters[0];

  return (
    <div
      key={data.id}
      className="fixed inset-0 z-[60] flex items-center overflow-hidden pointer-events-none"
    >
      <style>{`
        @keyframes vcDim {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vcBandIn {
          from { transform: translateX(-100%) skewX(-8deg); }
          to { transform: translateX(0) skewX(-8deg); }
        }
        @keyframes vcCharIn {
          0% { opacity: 0; transform: translateX(-60px) scale(0.85); }
          60% { opacity: 1; transform: translateX(10px) scale(1.05); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes vcTextIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vc-dim { animation: vcDim 0.25s ease-out forwards; }
        .vc-band { animation: vcBandIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .vc-char { animation: vcCharIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        .vc-text { animation: vcTextIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both; }
      `}</style>

      <div className="vc-dim absolute inset-0 bg-black/60" />

      <div
        className="vc-band absolute inset-y-0 left-0 w-full sm:w-3/4"
        style={{
          background:
            `linear-gradient(120deg, ${character.themeColor} 0%, ${character.themeColor}cc 55%, transparent 100%)`,
        }}
      />

      <div className="relative flex items-center gap-4 sm:gap-8 pl-6 sm:pl-16">
        <img
          src={character.imageUrl}
          alt={character.name}
          className="vc-char w-32 h-32 sm:w-52 sm:h-52 object-contain drop-shadow-2xl -scale-x-100"
        />
        <div className="vc-text flex flex-col">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-white/80">
            WINNER
          </span>
          <span className="text-3xl sm:text-5xl font-black tracking-wide text-white drop-shadow-lg">
            {data.playerName}
          </span>
          <span className="text-sm sm:text-base font-bold text-white/90 mt-1">
            {character.name}「{character.skillName}」
          </span>
        </div>
      </div>
    </div>
  );
}
