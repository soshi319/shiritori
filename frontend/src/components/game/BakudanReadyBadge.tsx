import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * 「一閃 準備完了」バッジ。
 * HpBar内の名前の隣（overflow-hiddenな行）に置かれるため、ポップオーバーを
 * 普通にabsolute配置すると親のoverflow-hiddenで切り取られて見えなくなってしまう。
 * そのため、ポップオーバー部分だけ createPortal で document.body 直下に描画し、
 * ボタンの実際の画面上の位置（getBoundingClientRect）を使って固定配置する。
 */
export function BakudanReadyBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
      });
    }

    setIsOpen((prev) => !prev);
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-label="一閃 準備完了の詳細を見る"
        className="flex items-center justify-center w-5 h-5 bg-red-900/60 border border-red-500 rounded-full text-[11px] leading-none animate-pulse shrink-0"
      >
        ⚔️
      </button>

      {isOpen && position && createPortal(
        <>
          {/* 背景をタップしたら閉じる、透明なオーバーレイ */}
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />

          <div
            className="fixed z-[101] w-44 max-w-[calc(100vw-2rem)] bg-white border border-red-200 rounded-lg shadow-lg p-2.5 flex flex-col gap-1 text-left animate-fade-in"
            style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold text-red-700 whitespace-nowrap">⚔️ 一閃 準備完了</p>
            <p className="text-[11px] text-stone-600 leading-snug">
              HP30以下の今、4文字で「ん」に終わる言葉を出すと必殺技が発動します。
            </p>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
