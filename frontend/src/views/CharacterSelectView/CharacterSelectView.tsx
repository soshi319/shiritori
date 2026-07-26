import { useEffect, useRef, useState } from 'react';
import type { Screen } from '../../types/screen';
import { characters } from 'shared/data/characters';

// HEXコードをRGBAに変換するユーティリティ関数
function hexToRgba(hex: string, alpha: number) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type CharacterSelectViewProps = {
  changeScreen: (screen: Screen) => void;
  onConfirmCharacter: (characterId: string) => void;
};

export function CharacterSelectView({ changeScreen, onConfirmCharacter }: CharacterSelectViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const carouselWidthRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ startX: number; startY: number; axis: 'x' | 'y' | null }>({
    startX: 0,
    startY: 0,
    axis: null,
  });

  // キャラクター切り替え時に詳細文をフェードインさせる演出
  useEffect(() => {
    setShowDescription(false);
    const timer = setTimeout(() => {
      setShowDescription(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedIndex]);

  function goToPrev() {
    setSelectedIndex((prev) => (prev === 0 ? characters.length - 1 : prev - 1));
  }

  function goToNext() {
    setSelectedIndex((prev) => (prev === characters.length - 1 ? 0 : prev + 1));
  }

  // スワイプによるキャラクター切り替え処理
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const AXIS_LOCK_THRESHOLD = 8;
    const EDGE_RESISTANCE = 0.35;

    function handleTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY, axis: null };
      setIsDragging(true);
    }

    function handleTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.startX;
      const dy = t.clientY - touchRef.current.startY;

      if (touchRef.current.axis === null) {
        if (Math.abs(dx) < AXIS_LOCK_THRESHOLD && Math.abs(dy) < AXIS_LOCK_THRESHOLD) {
          return;
        }
        touchRef.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }

      if (touchRef.current.axis !== 'x') return;

      e.preventDefault();

      const atLeftEdge = characters.length <= 1 && dx > 0;
      const atRightEdge = characters.length <= 1 && dx < 0;
      setDragOffsetPx(atLeftEdge || atRightEdge ? dx * EDGE_RESISTANCE : dx);
    }

    function handleTouchEnd() {
      setIsDragging(false);

      if (touchRef.current.axis === 'x') {
        const containerWidth = carouselWidthRef.current?.getBoundingClientRect().width
          ?? el!.getBoundingClientRect().width;
        const threshold = Math.min(80, containerWidth * 0.2);

        if (dragOffsetPx <= -threshold) goToNext();
        else if (dragOffsetPx >= threshold) goToPrev();
      }

      setDragOffsetPx(0);
      touchRef.current.axis = null;
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragOffsetPx]);

  const selectedCharacter = characters[selectedIndex];
  
  // characters.ts から色情報を取得
  const themeColor = selectedCharacter.themeColor || '#6366f1';
  const textColor = selectedCharacter.textColor || '#FFFFFF';
  
  const bgTintLight = hexToRgba(themeColor, 0.04);
  const bgTintDark = hexToRgba(themeColor, 0.12);

  return (
    <div
      ref={pageRef}
      className="fixed inset-0 flex flex-col items-center justify-between p-6 sm:p-8 w-full text-stone-800 overflow-y-auto touch-pan-y transition-colors duration-500"
      style={{
        background: `linear-gradient(180deg, ${bgTintLight} 0%, ${bgTintDark} 100%), #f5f5f4`,
      }}
    >
      {/* タイトル */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 pt-2 flex-shrink-0">
        キャラクター選択
      </h1>

      {/* カルーセル領域 */}
      <div ref={carouselWidthRef} className="relative w-full max-w-md my-auto py-2">
        {/* ナビゲーションボタン */}
        <button
          onClick={goToPrev}
          aria-label="前のキャラクター"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/90 border border-stone-200 text-stone-700 rounded-full hover:bg-white transition-all shadow-md active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          aria-label="次のキャラクター"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/90 border border-stone-200 text-stone-700 rounded-full hover:bg-white transition-all shadow-md active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* キャラクター画像 ＆ 名前表示 */}
        <div className="overflow-hidden w-full py-12 -my-12">
          <div
            className="flex"
            style={{
              transform: `translateX(calc(-${selectedIndex * 100}% + ${dragOffsetPx}px))`,
              transition: isDragging ? 'none' : 'transform 350ms cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {characters.map((character) => (
              <div
                key={character.id}
                className="w-full flex-shrink-0 flex flex-col items-center gap-3 px-10"
              >
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                  {/* 薄く上品なトーン（0.25）に調整した円形オーラ */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] pointer-events-none transition-all duration-500 z-0"
                    style={{
                      background: `radial-gradient(circle closest-side, ${hexToRgba(character.themeColor || '#94a3b8', 0.25)} 0%, ${hexToRgba(character.themeColor || '#94a3b8', 0)} 100%)`
                    }}
                  />
                  <img
                    src={`/images/${character.id}.png`}
                    alt={character.name}
                    className="relative w-full h-full object-contain drop-shadow-md z-10"
                  />
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-black text-stone-900 mb-1">{character.name}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-stone-800 text-white rounded-md">
                      {character.job}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">
                      {character.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* キャラクター詳細 ＆ 決定ボタン カード領域 */}
      <div className="w-full max-w-md bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xl flex flex-col gap-4 flex-shrink-0 my-auto">
        <div
          className={`flex flex-col gap-3 text-center transition-all duration-300 ${
            showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* フレーバーテキスト */}
          <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed italic px-2">
            {selectedCharacter.flavorText}
          </p>

          {/* ステータス領域 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-stone-400 tracking-wider">MAX HP</span>
              <span className="text-lg font-black text-stone-800">{selectedCharacter.maxHp}</span>
            </div>

            <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-stone-400 tracking-wider">ATK (基本威力)</span>
              <span className="text-lg font-black text-stone-800">{selectedCharacter.basePower}</span>
            </div>
          </div>

          {/* スキル詳細領域 */}
          <div
            className="rounded-xl p-3 text-left border transition-colors duration-300 flex flex-col gap-1.5"
            style={{
              backgroundColor: hexToRgba(themeColor, 0.06),
              borderColor: hexToRgba(themeColor, 0.25),
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded shadow-sm"
                style={{ backgroundColor: themeColor, color: textColor }}
              >
                SKILL
              </span>
              <span className="text-xs sm:text-sm font-bold text-stone-800">
                {selectedCharacter.skillName}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-stone-700 leading-relaxed">
              {selectedCharacter.skillDescription}
            </p>
          </div>
        </div>

        {/* 決定ボタン（全キャラクター共通の色・デザインに統一） */}
        <button
          onClick={() => {
            onConfirmCharacter(selectedCharacter.id);
            changeScreen('game');
          }}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-base tracking-wide shadow-md transition-all duration-200 bg-stone-800 text-white hover:bg-stone-700 hover:shadow-lg active:bg-stone-900 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>このキャラクターで対戦</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}