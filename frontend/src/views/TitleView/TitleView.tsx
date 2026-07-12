import type { Screen } from '../../types/screen';

type TitleViewProps = {
  changeScreen: (screen: Screen) => void;
  onOpenRules: () => void;
};

export function TitleView({ changeScreen, onOpenRules }: TitleViewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">しりとりバトル</h1>

      <div className="flex flex-col gap-4">
        <button
          className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500"
          onClick={() => changeScreen('modeSelect')}
        >
          スタート
        </button>

        <button
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm"
          onClick={onOpenRules}
        >
          ルール説明
        </button>
      </div>
    </div>
  );
}