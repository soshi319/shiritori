import { useState } from 'react';
import type { Screen } from '../../types/screen';
import { savePlayerName } from '../../utils/playerName';
import { characters } from 'shared/data/characters';

type TitleViewProps = {
  changeScreen: (screen: Screen) => void;
  onOpenRules: () => void;
  playerName: string;
  onChangePlayerName: (name: string) => void;
};

// 背景を流れる、実際につながっているしりとりチェーン（装飾用。ゲームロジックとは無関係）
const WORD_CHAIN = [
  'しりとり', 'りんご', 'ごりら', 'らくだ', 'だんご', 'ごま',
  'まくら', 'らっぱ', 'ぱんだ', 'だちょう', 'うちわ', 'わに', 'にじ', 'じてん',
];

export function TitleView({ changeScreen, onOpenRules, playerName, onChangePlayerName }: TitleViewProps) {
  const [inputValue, setInputValue] = useState(playerName);

  function handleBlur() {
    const finalName = savePlayerName(inputValue);
    setInputValue(finalName);
    onChangePlayerName(finalName);
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 via-stone-100 to-stone-200 overflow-hidden">
      {/* ★このコンポーネント専用のキーフレーム定義（tailwind.config.jsを触らずに完結させるため） */}
      <style>{`
        @keyframes titleShiritori_marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes titleShiritori_riseIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleShiritori_charRise {
          from { opacity: 0; transform: translateY(48px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ts-marquee-track {
          animation: titleShiritori_marquee 26s linear infinite;
        }
        .ts-rise-in {
          opacity: 0;
          animation: titleShiritori_riseIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .ts-char-rise {
          opacity: 0;
          animation: titleShiritori_charRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 背景：しりとりの単語チェーンが流れる帯（2本、逆方向） */}
      <div className="absolute inset-0 flex flex-col justify-between py-16 pointer-events-none select-none z-0">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="ts-marquee-track inline-flex items-center gap-3 text-2xl sm:text-3xl font-black text-stone-300/70">
            {[...WORD_CHAIN, ...WORD_CHAIN].map((w, i) => (
              <span key={`a-${i}`} className="flex items-center gap-3">
                {w}
                <span className="text-stone-300/50">→</span>
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden whitespace-nowrap">
          <div
            className="ts-marquee-track inline-flex items-center gap-3 text-2xl sm:text-3xl font-black text-stone-300/50"
            style={{ animationDirection: 'reverse', animationDuration: '32s' }}
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

      {/* キャラクターのラインナップ（画面下からのぞく） */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end gap-2 sm:gap-6 px-2 z-0 pointer-events-none">
        {characters.map((c, i) => (
          <img
            key={c.id}
            src={`/images/${c.id}.png`}
            alt=""
            className="ts-char-rise w-20 sm:w-32 h-auto object-contain drop-shadow-lg translate-y-4 sm:translate-y-6 opacity-90"
            style={{ animationDelay: `${0.5 + i * 0.12}s` }}
          />
        ))}
      </div>

      {/* メインコンテンツ（背景より手前、読みやすいようカード状に） */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-10 mx-4 rounded-3xl bg-white/70 backdrop-blur-sm shadow-lg border border-white/60">
        <div className="ts-rise-in flex flex-col items-center gap-1" style={{ animationDelay: '0.05s' }}>
          <h1 className="text-5xl font-extrabold tracking-normal text-stone-800">
            しりとリーグ
          </h1>
          <p className="text-xs font-medium text-stone-500 tracking-wide">
            しりとりで繰り広げられる熱い闘い
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="ts-rise-in flex flex-col gap-1.5" style={{ animationDelay: '0.15s' }}>
            <label htmlFor="player-name" className="text-xs font-medium text-stone-500 px-1">
              名前（オンライン対戦で相手に表示されます）
            </label>
            <input
              id="player-name"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              maxLength={12}
              placeholder="プレイヤー"
              className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 text-base transition-colors shadow-sm"
            />
          </div>

          <button
            className="ts-rise-in px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-center bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ animationDelay: '0.25s' }}
            onClick={() => changeScreen('modeSelect')}
          >
            スタート
          </button>

          <button
            className="ts-rise-in px-4 py-2.5 rounded-xl text-xs font-medium text-center bg-white text-stone-600 border border-stone-300/80 hover:bg-stone-50 shadow-sm transition-all duration-200"
            style={{ animationDelay: '0.35s' }}
            onClick={onOpenRules}
          >
            ルール説明
          </button>
        </div>
      </div>
    </div>
  );
}
