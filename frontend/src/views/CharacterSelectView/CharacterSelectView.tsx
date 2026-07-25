import { useEffect, useRef, useState } from 'react';
import type { Screen } from '../../types/screen';
import { characters } from 'shared/data/characters';

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
  // タッチ中の状態（再レンダリングを起こしたくないのでrefで持つ）
  const touchRef = useRef<{ startX: number; startY: number; axis: 'x' | 'y' | null }>({
    startX: 0,
    startY: 0,
    axis: null,
  });

  useEffect(() => {
    setShowDescription(false);

    const timer = setTimeout(() => {
      setShowDescription(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedIndex]);

  function goToPrev() {
    setSelectedIndex((prev) => (prev === 0 ? characters.length - 1 : prev - 1));
  }

  function goToNext() {
    setSelectedIndex((prev) => (prev === characters.length - 1 ? 0 : prev + 1));
  }

  // ★RuleViewと同じ操作感にするための軸ロック付きスワイプ処理。
  //   指が8px以上動くまでは縦横を判定せず、判定後「横」の時だけページ送りに追従させる。
  //   「縦」と判定された場合はpreventDefaultしないので、ページの縦スクロールがそのまま効く。
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const AXIS_LOCK_THRESHOLD = 8;
    const EDGE_RESISTANCE = 0.35; // 端をさらに引っ張った時の抵抗（このアプリは循環するので基本使わないが念のため）

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

      if (touchRef.current.axis !== 'x') return; // 縦方向と判定→標準スクロールに任せる

      e.preventDefault(); // 横方向と判定された時だけ、縦スクロールを止めて指に追従させる

      // キャラクターは先頭/末尾が循環するので基本は抵抗をかけないが、
      // 1体しかいない等の将来的な変化に備えて同じロジックを残しておく
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragOffsetPx]);

  const selectedCharacter = characters[selectedIndex];

  return (
    <div ref={pageRef} className="fixed inset-0 flex flex-col items-center gap-8 p-8 w-full bg-stone-100 text-stone-800 overflow-y-auto touch-pan-y">
      <h1 className="text-3xl font-extrabold tracking-normal text-stone-800">キャラクター選択</h1>

      <div ref={carouselWidthRef} className="relative w-full max-w-md overflow-hidden">
        <button
          onClick={goToPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-xl px-4 py-3 bg-white/80 border border-stone-200 text-stone-700 rounded-full hover:bg-white transition-colors shadow-sm"
        >
          ◀
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-xl px-4 py-3 bg-white/80 border border-stone-200 text-stone-700 rounded-full hover:bg-white transition-colors shadow-sm"
        >
          ▶
        </button>

        <div
          className="flex"
          style={{
            transform: `translateX(calc(-${selectedIndex * 100}% + ${dragOffsetPx}px))`,
            transition: isDragging ? 'none' : 'transform 300ms ease-out',
          }}
        >
          {characters.map((character) => (
            <div
              key={character.id}
              className="w-full flex-shrink-0 flex flex-col items-center gap-4 px-12"
            >
              <div className="w-56 h-56 flex items-center justify-center">
                <img
                  src={`/images/${character.id}.png`}
                  alt={character.name}
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">{character.name}</h2>
              <p className="text-sm text-stone-500">
                {character.job} ／ {character.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`max-w-md text-center transition-opacity duration-500 flex flex-col gap-1 ${
          showDescription ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-sm text-stone-600 mb-2">{selectedCharacter.flavorText}</p>
        <p className="text-sm font-semibold text-stone-700">HP: {selectedCharacter.maxHp}</p>
        <p className="text-sm font-medium text-stone-600">
          固有スキル「{selectedCharacter.skillName}」: {selectedCharacter.skillDescription}
        </p>
      </div>

      <button
        onClick={() => {
          onConfirmCharacter(selectedCharacter.id);
          changeScreen('game');
        }}
        className="px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-center bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-sm transition-all duration-200"
      >
        このキャラクターで対戦する
      </button>
    </div>
  );
}
