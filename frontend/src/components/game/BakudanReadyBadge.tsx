import { useState } from 'react';

/**
 * 「一閃 準備完了」バッジ。
 * HPバー内の名前の隣に並ぶため、他のバッジ（毒×2、コンボ×3など）と同じく
 * アイコン+短い表示に留め、詳しい説明はタップした時だけポップオーバーで出す。
 */
export function BakudanReadyBadge() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label="一閃 準備完了の詳細を見る"
        className="flex items-center justify-center w-5 h-5 bg-red-900/60 border border-red-500 rounded-full text-[11px] leading-none animate-pulse"
      >
        ⚔️
      </button>

      {isOpen && (
        <>
          {/* 背景をタップしたら閉じる、透明なオーバーレイ */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          <div
            className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 z-40 w-44 max-w-[calc(100vw-2rem)] bg-white border border-red-200 rounded-lg shadow-lg p-2.5 flex flex-col gap-1 text-left animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold text-red-700 whitespace-nowrap">⚔️ 一閃 準備完了</p>
            <p className="text-[11px] text-stone-600 leading-snug">
              HP30以下の今、4文字で「ん」に終わる言葉を出すと必殺技が発動します。
            </p>
          </div>
        </>
      )}
    </span>
  );
}
