import type { Screen } from '../../types/screen';

type ModeSelectViewProps = {
  changeScreen: (screen: Screen) => void;
};

export function ModeSelectView({ changeScreen }: ModeSelectViewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">モード選択</h1>

      <div className="flex flex-col gap-4">
        <button
          className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500"
          onClick={() => changeScreen('characterSelect')}
        >
          オンライン対戦
        </button>

        <button
          className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600"
          onClick={() => changeScreen('title')}
        >
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}