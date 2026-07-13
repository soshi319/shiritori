import type { Screen } from '../../types/screen';

type ModeSelectViewProps = {
  changeScreen: (screen: Screen) => void;
};

export function ModeSelectView({ changeScreen }: ModeSelectViewProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-stone-100">
      <h1 className="text-3xl font-extrabold tracking-normal text-stone-800">
        モード選択
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-sm px-4">
        <div className="flex flex-row gap-3 w-full">
          <button
            className="flex-1 px-4 py-3.5 rounded-xl text-sm font-semibold text-center bg-white text-stone-700 border border-stone-300/80 hover:bg-stone-50 hover:text-stone-900 shadow-sm transition-all duration-200"
            onClick={() => changeScreen('practice')}
          >
            練習モード
          </button>
          
          <button
            className="flex-1 px-4 py-3.5 rounded-xl text-sm font-semibold text-center bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-sm transition-all duration-200"
            onClick={() => changeScreen('characterSelect')}
          >
            バトルモード
          </button>
        </div>

        <button
          className="px-6 py-2.5 rounded-xl text-xs font-medium text-center bg-stone-200/60 hover:bg-stone-200 text-stone-600 transition-all duration-200"
          onClick={() => changeScreen('title')}
        >
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}