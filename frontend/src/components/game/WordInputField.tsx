import { useState } from 'react';

type WordInputFieldProps = {
  onSubmit: (word: string) => void;
  disabled?: boolean;
};

export function WordInputField({ onSubmit, disabled = false }: WordInputFieldProps) {
  const [word, setWord] = useState('');

  function handleSubmit() {
    const trimmedWord = word.trim();
    if (trimmedWord.length === 0) return;

    onSubmit(trimmedWord);
    setWord('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="単語を入力..."
          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || word.trim().length === 0}
          className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          送信
        </button>
      </div>

      <p className="text-xs text-gray-400 text-right">
        {word.length}文字
        {word.length === 1 && (
          <span className="text-red-400 font-bold ml-1">（最大威力！）</span>
        )}
      </p>
    </div>
  );
}