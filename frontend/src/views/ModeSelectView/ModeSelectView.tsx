import type { Screen } from '../../types/screen';

type ModeSelectViewProps = {
  changeScreen: (screen: Screen) => void;
  setCpuMode: (isCpu: boolean) => void;
};

// 背景を流れるしりとりチェーン
const WORD_CHAIN = [
  'しりとり', 'りんご', 'ごりら', 'らくだ', 'だんご', 'ごま',
  'まくら', 'らっぱ', 'ぱんだ', 'だちょう', 'うちわ', 'わに', 'にじ', 'じてん',
];

export function ModeSelectView({ changeScreen, setCpuMode }: ModeSelectViewProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 via-stone-100 to-stone-200 overflow-hidden">
      <style>{`
        @keyframes modeShiritori_marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes modeShiritori_riseIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ms-marquee-track {
          animation: modeShiritori_marquee 30s linear infinite;
        }
        .ms-rise-in {
          opacity: 0;
          animation: modeShiritori_riseIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 背景：流れる言葉の帯 */}
      <div className="absolute inset-0 flex flex-col justify-between py-16 pointer-events-none select-none z-0">
        <div className="overflow-hidden whitespace-nowrap opacity-40">
          <div className="ms-marquee-track inline-flex items-center gap-3 text-2xl sm:text-3xl font-black text-stone-300">
            {[...WORD_CHAIN, ...WORD_CHAIN].map((w, i) => (
              <span key={`a-${i}`} className="flex items-center gap-3">
                {w}
                <span className="text-stone-300/50">→</span>
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden whitespace-nowrap opacity-30">
          <div
            className="ms-marquee-track inline-flex items-center gap-3 text-2xl sm:text-3xl font-black text-stone-300"
            style={{ animationDirection: 'reverse', animationDuration: '36s' }}
          >
            {[...WORD_CHAIN, ...WORD_CHAIN].reverse().map((w, i) => (
              <span key={`b-${i}`} className="flex items-center gap-3">
                {w}
                <span className="text-stone-300/40">→</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center w-full px-6 max-w-xs">
        
        {/* ヘッダータイトル */}
        <div className="ms-rise-in mb-8 text-center" style={{ animationDelay: '0.05s' }}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-stone-800 drop-shadow-sm">
            モード選択
          </h1>
          <p className="text-xs font-bold text-stone-500 mt-1 tracking-widest uppercase">
            Select Game Mode
          </p>
        </div>

        {/* ボタン一覧 */}
        <div className="flex flex-col gap-3.5 w-full">
          {/* オンライン対戦（熱いバトル感を出すオレンジ〜ゴールドのグラデーション） */}
          <button
            className="ms-rise-in w-full px-6 py-4 rounded-xl text-base font-black tracking-wider text-center bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-900/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] antialiased transform-gpu will-change-transform"
            style={{ animationDelay: '0.15s' }}
            onClick={() => {
              setCpuMode(false);
              changeScreen('characterSelect');
            }}
          >
            オンライン対戦
          </button>

          {/* CPU対戦（知的なAI戦をイメージした深みのあるティール/青緑 + 影を少し強調） */}
          <button
            className="ms-rise-in w-full px-6 py-3.5 rounded-xl text-sm font-bold tracking-wide text-center bg-teal-700 hover:bg-teal-600 text-teal-50 shadow-lg shadow-teal-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] antialiased transform-gpu will-change-transform"
            style={{ animationDelay: '0.25s' }}
            onClick={() => {
              setCpuMode(true);
              changeScreen('characterSelect');
            }}
          >
            CPU対戦
          </button>

          {/* 練習モード */}
          <button
            className="ms-rise-in w-full px-4 py-3 rounded-xl text-sm font-bold text-center bg-white/90 text-stone-700 border border-stone-300 hover:bg-stone-50 shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] antialiased transform-gpu will-change-transform"
            style={{ animationDelay: '0.35s' }}
            onClick={() => changeScreen('practice')}
          >
            練習モード
          </button>

          {/* ランキング */}
          <button
            className="ms-rise-in w-full px-4 py-3 rounded-xl text-sm font-bold text-center bg-white/90 text-stone-700 border border-stone-300 hover:bg-stone-50 shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] antialiased transform-gpu will-change-transform"
            style={{ animationDelay: '0.45s' }}
            onClick={() => changeScreen('ranking')}
          >
            🏆 ランキング
          </button>

          {/* タイトルへ戻る */}
          <button
            className="ms-rise-in mt-3 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors text-center antialiased transform-gpu will-change-transform"
            style={{ animationDelay: '0.55s' }}
            onClick={() => changeScreen('title')}
          >
            ← タイトルへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}