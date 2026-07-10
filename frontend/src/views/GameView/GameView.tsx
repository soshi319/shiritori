import { useState } from 'react';
import type { Screen } from '../../types/screen';

type GameViewProps = {
  changeScreen: (screen: Screen) => void;
  // 本当はここで選択したキャラデータを受け取りますが、今は見た目作りなので省略します
};

export function GameView({ changeScreen }: GameViewProps) {
  // 見た目を確認するための仮のステート（後で本物のデータに置き換えます）
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [currentWord, setCurrentWord] = useState('しりとり');

  return (
    <div className="flex flex-col w-full h-screen max-w-md mx-auto p-4 justify-between bg-gray-900 text-white">
      
      {/* --- 上部：相手（敵）エリア --- */}
      <div className="flex flex-col gap-2 p-4 bg-red-900/40 border border-red-800 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">対戦相手 (アルド)</span>
          <span className="text-sm bg-red-800 px-2 py-1 rounded">HP 120/120</span>
        </div>
        {/* HPバー */}
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 w-full"></div>
        </div>
      </div>

      {/* --- 中央：ゲーム情報エリア --- */}
      <div className="flex flex-col items-center justify-center flex-grow gap-6">
        {/* タイマー */}
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-sm">残り時間</span>
          <span className="text-5xl font-mono font-bold text-yellow-400">{timeLeft}</span>
        </div>

        {/* 現在の単語 */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-gray-400 text-sm">現在の言葉</span>
          <div className="text-4xl font-bold tracking-widest bg-gray-800 px-8 py-4 rounded-xl shadow-inner">
            {currentWord}
          </div>
          <span className="text-indigo-400 font-bold mt-2">
            「<span className="text-2xl">り</span>」から始まる言葉を入力！
          </span>
        </div>
      </div>

      {/* --- 下部：自分（プレイヤー）エリア --- */}
      <div className="flex flex-col gap-4">
        {/* 自分のステータス */}
        <div className="flex flex-col gap-2 p-4 bg-indigo-900/40 border border-indigo-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">あなた (ドロシー)</span>
            <span className="text-sm bg-indigo-800 px-2 py-1 rounded">HP 90/90</span>
          </div>
          {/* HPバー */}
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-full"></div>
          </div>
        </div>

        {/* 入力フォーム */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ひらがなで入力..."
            className="flex-grow px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
          <button className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 font-bold">
            攻撃！
          </button>
        </div>
      </div>

      {/* デバッグ用：タイトルへ戻るボタン */}
      <button 
        onClick={() => changeScreen('title')}
        className="mt-4 text-sm text-gray-500 underline text-center"
      >
        タイトルに戻る
      </button>

    </div>
  );
}