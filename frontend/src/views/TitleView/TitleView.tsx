import { useState } from 'react';
import type { Screen } from '../../types/screen';
import { savePlayerName } from '../../utils/playerName';

type TitleViewProps = {
  changeScreen: (screen: Screen) => void;
  onOpenRules: () => void;
  playerName: string;
  onChangePlayerName: (name: string) => void;
};

export function TitleView({ changeScreen, onOpenRules, playerName, onChangePlayerName }: TitleViewProps) {
  const [inputValue, setInputValue] = useState(playerName);

  function handleBlur() {
    const finalName = savePlayerName(inputValue);
    setInputValue(finalName);
    onChangePlayerName(finalName);
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-stone-100 transition-colors duration-500">
      <h1 className="text-5xl font-extrabold tracking-normal text-stone-800">
        しりとリーグ
      </h1>

      <div className="flex flex-col gap-3 w-full max-w-xs px-4">
        <div className="flex flex-col gap-1.5">
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
          className="px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-center bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-sm transition-all duration-200"
          onClick={() => changeScreen('modeSelect')}
        >
          スタート
        </button>

        <button
          className="px-4 py-2.5 rounded-xl text-xs font-medium text-center bg-white text-stone-600 border border-stone-300/80 hover:bg-stone-50 shadow-sm transition-all duration-200"
          onClick={onOpenRules}
        >
          ルール説明
        </button>
      </div>
    </div>
  );
}
