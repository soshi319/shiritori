import type { Screen } from '../../types/screen';

type TitleViewProps = {
  changeScreen: (screen: Screen) => void;
};

export function TitleView({ changeScreen }: TitleViewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">しりとりバトル</h1>
      <button
        className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500"
        onClick={() => changeScreen('modeSelect')}
      >
        スタート
      </button>
    </div>
  );
};