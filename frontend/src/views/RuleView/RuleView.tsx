import { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from 'shared/config/gameConfig';
import { characters } from 'shared/data/characters';

// ダメージ計算の説明用に、架空の減衰率でグラフを作る（特定キャラの数値ではなく一般例として提示）
const SAMPLE_DECAY_RATE = 0.7;
const SAMPLE_BASE_POWER = 100;
const CHART_LENGTHS = [1, 2, 3, 4, 5, 6];
const CHART_DAMAGES = CHART_LENGTHS.map((len) =>
  Math.ceil(SAMPLE_BASE_POWER * Math.pow(SAMPLE_DECAY_RATE, len - 1))
);
const CHART_MAX = CHART_DAMAGES[0];

function DamageChart() {
  const barWidth = 36;
  const gap = 12;
  const chartHeight = 120;
  const width = CHART_LENGTHS.length * (barWidth + gap) - gap;

  return (
    <svg
      viewBox={`0 0 ${width} ${chartHeight + 30}`}
      className="w-full max-w-xs mx-auto"
      role="img"
      aria-label="文字数が短いほどダメージが大きくなることを示す棒グラフ"
    >
      {CHART_LENGTHS.map((len, i) => {
        const dmg = CHART_DAMAGES[i];
        const barHeight = (dmg / CHART_MAX) * chartHeight;
        const x = i * (barWidth + gap);
        const y = chartHeight - barHeight;

        return (
          <g key={len}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              className={i === 0 ? 'fill-indigo-600' : 'fill-stone-400'}
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-stone-700 text-[11px] font-semibold"
            >
              {dmg}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 18}
              textAnchor="middle"
              className="fill-stone-500 text-[11px]"
            >
              {len}文字
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type Page = {
  title: string;
  content: React.ReactNode;
};

const PAGES: Page[] = [
  {
    title: '基本ルール',
    content: (
      <>
        <p>交互に単語をつなげ、相手のHPを0にしたら勝利。</p>
        <p>制限時間は<strong className="text-stone-900">{GAME_CONFIG.TURN_DURATION_SEC}秒</strong>。</p>
        <p><strong className="text-stone-900">2回連続パス</strong>で敗北。</p>
      </>
    ),
  },
  {
    title: '与ダメージ',
    content: (
      <>
        <p>短い単語ほど、ダメージは大きくなる。</p>
        <DamageChart />
      </>
    ),
  },
  {
    title: '攻撃の反射',
    content: (
      <>
        <p>自分の番でないとき、相手の次の単語を予測して入力する。</p>
        <p>予測が的中すると「反射」が発動し、攻撃をそのまま跳ね返せる。</p>
      </>
    ),
  },
  {
    title: '必殺技「一閃」',
    content: (
      <>
        <p>
          HP<strong className="text-stone-900">30以下</strong>の時、
          <strong className="text-stone-900">4文字</strong>かつ「ん」で終わる言葉を出すと必殺技発動。
        </p>
        <p className="text-red-700 font-semibold">
          条件を満たさず「ん」で終わると、そのまま反則負け。
        </p>
      </>
    ),
  },
  {
    title: 'キャラクター',
    content: (
      <>
        <p>4人から1人を選んで対戦。それぞれ固有スキルを持つ。</p>
        <div className="flex flex-col gap-3">
          {characters.map((c) => (
            <div key={c.id} className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex flex-col gap-0.5">
              <p className="text-xl font-bold text-stone-900">{c.name}</p>
              <p className="text-base font-semibold text-indigo-700">{c.skillName}</p>
              <p className="text-lg text-stone-700 leading-snug">{c.skillDescription}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

export function RuleView() {
  const [pageIndex, setPageIndex] = useState(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackWrapperRef = useRef<HTMLDivElement>(null);
  // タッチ中の状態（再レンダリングを起こしたくないのでrefで持つ）
  const touchRef = useRef<{ startX: number; startY: number; axis: 'x' | 'y' | null }>({
    startX: 0,
    startY: 0,
    axis: null,
  });

  const isFirst = pageIndex === 0;
  const isLast = pageIndex === PAGES.length - 1;

  function goToPrev() {
    setPageIndex((prev) => Math.max(0, prev - 1));
  }

  function goToNext() {
    setPageIndex((prev) => Math.min(PAGES.length - 1, prev + 1));
  }

  // ★縦スクロールと横スワイプの誤反応を防ぐため、指の動きが「横」だと判定できてから
  //   初めてページ送りの追従を始める。判定前・縦方向と判定された場合はブラウザ標準の
  //   縦スクロールに任せる（preventDefaultしない）。
  //   preventDefaultを確実に効かせるため、Reactの合成イベントではなくネイティブの
  //   addEventListenerを { passive: false } で登録する。
  useEffect(() => {
    const el = trackWrapperRef.current;
    if (!el) return;

    const AXIS_LOCK_THRESHOLD = 8; // これ未満の移動ではまだ縦横を判定しない
    const EDGE_RESISTANCE = 0.35; // 最初/最後のページをさらに引っ張った時の抵抗

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

      const atLeftEdge = pageIndex === 0 && dx > 0;
      const atRightEdge = pageIndex === PAGES.length - 1 && dx < 0;
      setDragOffsetPx(atLeftEdge || atRightEdge ? dx * EDGE_RESISTANCE : dx);
    }

    function handleTouchEnd() {
      setIsDragging(false);

      if (touchRef.current.axis === 'x') {
        const containerWidth = el!.getBoundingClientRect().width;
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
  }, [pageIndex, dragOffsetPx]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between pr-10 flex-shrink-0">
        <h2 className="text-2xl font-bold text-stone-900">ルール説明</h2>
        <span className="text-base font-medium text-stone-400 whitespace-nowrap">
          {pageIndex + 1} / {PAGES.length}
        </span>
      </div>

      {/* ここだけがスクロール/横スワイプの対象。overflow-hiddenでカルーセルの中身をクリップする */}
      <div ref={trackWrapperRef} className="flex-1 min-h-0 overflow-hidden touch-pan-y">
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(-${pageIndex * 100}% + ${dragOffsetPx}px))`,
            transition: isDragging ? 'none' : 'transform 300ms ease-out',
          }}
        >
          {PAGES.map((p) => (
            <div key={p.title} className="w-full flex-shrink-0 h-full overflow-y-auto pr-1">
              <h3 className="font-bold text-indigo-700 text-2xl mb-3">{p.title}</h3>
              <div className="text-xl text-stone-700 leading-relaxed flex flex-col gap-4 pb-2">
                {p.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone-200 flex-shrink-0">
        <button
          onClick={goToPrev}
          disabled={isFirst}
          className="px-4 py-2 rounded-xl text-base font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-0 disabled:pointer-events-none transition-colors"
        >
          ← 前へ
        </button>

        <div className="flex gap-1.5">
          {PAGES.map((p, i) => (
            <button
              key={p.title}
              onClick={() => setPageIndex(i)}
              aria-label={`${i + 1}ページ目へ`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === pageIndex ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          disabled={isLast}
          className="px-4 py-2 rounded-xl text-base font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-0 disabled:pointer-events-none transition-colors"
        >
          次へ →
        </button>
      </div>
    </div>
  );
}
