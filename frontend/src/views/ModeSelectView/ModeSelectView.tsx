import type { Screen } from '../../types/screen';

type ModeSelectViewProps = {
  changeScreen: (screen: Screen) => void;
  setCpuMode: (isCpu: boolean) => void;
};

export function ModeSelectView({ changeScreen, setCpuMode }: ModeSelectViewProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-stone-100">
      <h1 className="text-3xl font-extrabold tracking-normal text-stone-800">
        モード選択
      </h1>

      <div className="flex flex-col gap-3 w-full max-w-sm px-4">
        {/* 練習モードボタン */}
        <button
          className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-center bg-white text-stone-700 border border-stone-300/80 hover:bg-stone-50 hover:text-stone-900 shadow-sm transition-all duration-200"
          onClick={() => changeScreen('practice')}
        >
          練習モード
        </button>

        {/* CPU対戦モードボタン */}
        <button
          className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-center bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-sm transition-all duration-200"
          onClick={() => {
            setCpuMode(true);
            changeScreen('characterSelect');
          }}
        >
          CPU対戦
        </button>

        {/* オンラインマルチ対戦ボタン（レート対象） */}
        <button
          className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-center bg-indigo-800 hover:bg-indigo-700 text-indigo-100 shadow-sm transition-all duration-200"
          onClick={() => {
            setCpuMode(false);
            changeScreen('characterSelect');
          }}
        >
          オンライン対戦
        </button>

        {/* ランキングボタン */}
        <button
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-center bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-all duration-200"
          onClick={() => changeScreen('ranking')}
        >
          🏆 ランキング
        </button>

        {/* タイトルへ戻るボタン */}
        <button
          className="mt-4 px-4 py-2 rounded-xl text-xs font-medium text-center bg-stone-200/60 hover:bg-stone-200 text-stone-600 transition-all duration-200"
          onClick={() => changeScreen('title')}
        >
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}
