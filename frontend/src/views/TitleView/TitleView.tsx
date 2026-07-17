import type { Screen } from '../../types/screen';

type TitleViewProps = {
  changeScreen: (screen: Screen) => void;
  onOpenRules: () => void;
};

export function TitleView({ changeScreen, onOpenRules }: TitleViewProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-stone-100 transition-colors duration-500">
      <h1 className="text-5xl font-extrabold tracking-normal text-stone-800">
        しりとりーぐ
      </h1>

      <div className="flex flex-col gap-3 w-full max-w-xs px-4">
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
