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

    // 辞書チェック
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
    <div className="flex flex-col items-center max-w-lg mx-auto p-6 min-h-[100dvh] bg-gray-900 text-white gap-6">
      <div className="w-full flex justify-between items-center">
        <button
          onClick={() => changeScreen('modeSelect')}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← モード選択へ戻る
        </button>
        <button
          onClick={startNewGame}
          className="text-sm text-gray-400 hover:text-white underline"
        >
          最初からやり直す
        </button>
      </div>

      <h1 className="text-2xl font-bold">しりとり練習モード</h1>

      <div className="text-center">
        <p className="text-sm text-gray-400 mb-1">前の言葉：</p>
        <p className="text-4xl font-black text-indigo-400 tracking-wider">「{currentWord}」</p>
      </div>

      {error && (
        <p className="text-red-400 font-bold animate-pulse">{error}</p>
      )}

      {!isGameOver ? (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            name="input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="次の言葉を入力"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-lg disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={isChecking}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {isChecking ? '確認中...' : '送信する'}
          </button>
        </form>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 bg-gray-800 p-6 rounded-lg border border-red-500/50">
          <p className="text-xl font-bold text-red-400">ゲーム終了！</p>
          <button
            onClick={startNewGame}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            もう一度遊ぶ
          </button>
        </div>
      )}

      {matchingPastWords.length > 0 && (
        <div className="w-full">
          <p className="text-sm text-gray-400 mb-2">
            「{requiredStartNow}」から始まる、過去に使った言葉
          </p>
          <div className="flex flex-wrap gap-2">
            {matchingPastWords.map((w, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-full text-sm text-gray-300"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="w-full flex-1">
        <p className="text-sm text-gray-400 mb-2">入力履歴：</p>
        <div className="bg-gray-800 rounded-lg p-4 h-48 overflow-y-auto flex flex-col gap-1 border border-gray-700">
          {history.map((w, index) => (
            <p key={index} className="text-gray-200 font-medium">
              <span className="text-gray-500 mr-2">{index + 1}.</span>{w}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}