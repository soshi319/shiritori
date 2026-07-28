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

// 背景を流れるしりとりチェーン
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
        @keyframes titleShiritori_dropBounce {
          0% { opacity: 0; transform: translateY(-40px) scale(0.8); }
          50% { opacity: 1; transform: translateY(5px) scale(1.1); }
          75% { transform: translateY(-2px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
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
        .ts-drop-char {
          opacity: 0;
          animation: titleShiritori_dropBounce 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      {/* 背景 */}
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

      {/* キャラクター */}
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

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center w-full px-6 mb-8">
        
        {/* ★ タイトルロゴ */}
        <div className="ts-drop-char mb-6 sm:mb-10 w-full" style={{ animationDelay: '0.1s' }}>
          {/* 本番用の画像ロゴ（後ですぐ戻せるように待機）
          <img 
            src="/images/logo.png" 
            alt="シリトリーグ" 
            className="mx-auto w-full max-w-[320px] sm:max-w-[420px] h-auto drop-shadow-lg pointer-events-none select-none px-2"
          />
          */}

          {/* シンプルなSVGロゴ（今回追加） */}
          <img
            src="/images/logo.svg"
            alt="シリトリーグ"
            className="mx-auto w-full max-w-[420px] sm:max-w-[560px] h-auto drop-shadow-md pointer-events-none select-none px-2"
          />
        </div>

        <div className="flex flex-col gap-5 w-full max-w-xs">
          {/* 名前入力欄 */}
          <div className="ts-rise-in flex flex-col gap-2" style={{ animationDelay: '0.6s' }}>
            <label htmlFor="player-name" className="text-xs font-bold text-stone-600 px-1 drop-shadow-sm">
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
              className="w-full px-4 py-3 bg-white/95 border-2 border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 text-base transition-colors shadow-md"
            />
          </div>

          {/* ボタン類 */}
          <div className="ts-rise-in flex flex-col gap-3 mt-2" style={{ animationDelay: '0.7s' }}>
            <button
              className="w-full px-6 py-4 rounded-xl text-lg font-black tracking-widest text-center bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-stone-100 shadow-xl shadow-stone-800/20 transition-colors duration-150 select-none"
              onClick={() => changeScreen('modeSelect')}
            >
              スタート
            </button>

            <button
              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-center bg-white/90 text-stone-600 border border-stone-300 hover:bg-stone-100 active:bg-stone-200 shadow-md transition-colors duration-150 select-none"
              onClick={onOpenRules}
            >
              ルール説明
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}