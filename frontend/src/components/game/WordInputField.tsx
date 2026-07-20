import { useState, useRef, useEffect } from 'react';

type WordInputFieldProps = {
  onSubmit: (word: string) => void;
  disabled?: boolean;
  isMyTurn: boolean;
  requiredStart: string;
};

export function WordInputField({ onSubmit, disabled = false, isMyTurn, requiredStart }: WordInputFieldProps) {
  const [word, setWord] = useState('');
  // 1. input要素を参照するためのrefを作成
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. 自分のターンで、入力可能な状態になったら自動でフォーカスする
  useEffect(() => {
    if (isMyTurn && !disabled) {
      // 画面の描画完了後に確実にフォーカスを当てるためのわずかな遅延
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, disabled]);

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
      <div className="text-center font-extrabold text-xs tracking-wider mb-0.5">
        {isMyTurn ? (
          <span className="text-red-700">⚔️ しりとりで攻撃 </span>
        ) : (
          <span className="text-blue-700 animate-pulse">🛡️ 言葉を予測して防御 </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          // 3. input要素にrefを紐付ける
          ref={inputRef}
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={isMyTurn ? `「${requiredStart}」から始まる単語を入力...` : `相手が打つ単語を先読み予測...`}
          className={`flex-1 px-4 py-3 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none disabled:opacity-50 border-2 transition-all duration-200 shadow-sm ${
            isMyTurn
              ? 'border-red-500/60 focus:border-red-600 shadow-red-500/10'
              : 'border-sky-500/60 focus:border-sky-600 shadow-sky-500/10'
          }`}
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || word.trim().length === 0}
          className={`px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none shadow-sm ${
            isMyTurn
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-sky-600 hover:bg-sky-500'
          }`}
        >
          {isMyTurn ? '攻撃' : '予測'}
        </button>
      </div>
    </div>
  );
}