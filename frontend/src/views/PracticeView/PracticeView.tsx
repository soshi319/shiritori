import { useState, useEffect } from 'react';
import type { Screen } from '../../types/screen';
import { getRequiredNextStart, normalizeWordForComparison } from 'shared/logic/shiritoriValidator';
import { checkWordExists } from '../../utils/checkWordExists';

type PracticeViewProps = {
  changeScreen: (screen: Screen) => void;
};

const STARTING_WORDS = [
  'しりとり', 'りんご', 'れきし', 'ろぼっと',
  'めがね', 'ねこ', 'こま', 'まり', 'りす',
  'すいか', 'からす', 'すずめ', 'めだか', 'かめ',
];

const HIRAGANA_ONLY_REGEX = /^[ぁ-んー]+$/;

export function PracticeView({ changeScreen }: PracticeViewProps) {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const randomIndex = Math.floor(Math.random() * STARTING_WORDS.length);
    const firstWord = STARTING_WORDS[randomIndex];

    setCurrentWord(firstWord);
    setHistory([firstWord]);
    setInputText('');
    setError('');
    setIsGameOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGameOver || isChecking) return;

    const trimmedInput = inputText.trim();
    if (trimmedInput.length === 0) return;

    setError('');

    if (!HIRAGANA_ONLY_REGEX.test(trimmedInput)) {
      setError('ひらがなで入力してください');
      return;
    }

    const word = normalizeWordForComparison(trimmedInput);
    const requiredStart = getRequiredNextStart(currentWord);

    if (!word.startsWith(requiredStart)) {
      setError(`「${requiredStart}」から始まる言葉を入力してください！`);
      return;
    }

    if (history.includes(word)) {
      setError(`「${word}」はすでに使用されています。`);
      setIsGameOver(true);
      return;
    }

    if (word.endsWith('ん')) {
      setError(`「${word}」は末尾が「ん」で終わっています。`);
      setIsGameOver(true);
      setHistory((prev) => [...prev, word]);
      setCurrentWord(word);
      return;
    }

    setIsChecking(true);
    const exists = await checkWordExists(word);
    setIsChecking(false);

    if (!exists) {
      setError(`「${word}」は辞書に見つかりませんでした。別の単語を試してください。`);
      return;
    }

    setHistory((prev) => [...prev, word]);
    setCurrentWord(word);
    setInputText('');
  };

  const wordsByFirstChar = (() => {
    const index: Record<string, string[]> = {};
    for (const w of history.slice(0, -1)) {
      const firstChar = w.charAt(0);
      if (!index[firstChar]) index[firstChar] = [];
      index[firstChar].push(w);
    }
    return index;
  })();

  const requiredStartNow = getRequiredNextStart(currentWord);
  const matchingPastWords = (wordsByFirstChar[requiredStartNow.charAt(0)] ?? [])
    .filter((w) => w.startsWith(requiredStartNow));

  return (
    <div className="fixed inset-0 flex flex-col items-center max-w-lg mx-auto p-6 min-h-[100dvh] bg-stone-100 text-stone-800 gap-6 overflow-y-auto">
      <div className="w-full flex justify-between items-center">
        <button
          onClick={() => changeScreen('modeSelect')}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          ← モード選択へ戻る
        </button>
        <button
          onClick={startNewGame}
          className="text-sm text-stone-500 hover:text-stone-800 underline transition-colors"
        >
          最初からやり換える
        </button>
      </div>

      <h1 className="text-2xl font-extrabold tracking-normal text-stone-800">
        しりとり練習モード
      </h1>

      <div className="text-center">
        <p className="text-sm text-stone-500 mb-1">前の言葉：</p>
        <p className="text-4xl font-black text-stone-800 tracking-wider">「{currentWord}」</p>
      </div>

      {error && (
        <p className="text-amber-600 font-semibold">{error}</p>
      )}

      {!isGameOver ? (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            name="input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="次の言葉を入力"
            className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 text-lg disabled:opacity-50 transition-colors shadow-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={isChecking}
            className="w-full bg-stone-800 text-stone-100 font-semibold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isChecking ? '確認中...' : '送信する'}
          </button>
        </form>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 bg-white p-6 rounded-xl border border-amber-500/30 shadow-sm">
          <p className="text-xl font-bold text-amber-600">ゲーム終了！</p>
          <button
            onClick={startNewGame}
            className="w-full bg-stone-800 text-stone-100 font-semibold py-3 rounded-xl hover:bg-stone-700 transition-colors shadow-sm"
          >
            もう一度遊ぶ
          </button>
        </div>
      )}

      {matchingPastWords.length > 0 && (
        <div className="w-full">
          <p className="text-sm text-stone-500 mb-2">
            「{requiredStartNow}」から始まる、過去に使った言葉
          </p>
          <div className="flex flex-wrap gap-2">
            {matchingPastWords.map((w, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white border border-stone-200 rounded-full text-sm text-stone-600 shadow-sm"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="w-full flex-1 min-h-[12rem]">
        <p className="text-sm text-stone-500 mb-2">入力履歴：</p>
        <div className="bg-white rounded-xl p-4 h-48 overflow-y-auto flex flex-col gap-1 border border-stone-200 shadow-sm明确">
          {history.map((w, index) => (
            <p key={index} className="text-stone-700 font-medium">
              <span className="text-stone-400 mr-2">{index + 1}.</span>{w}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}