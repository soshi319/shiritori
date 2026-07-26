import { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from 'shared/config/gameConfig';
import { characters } from 'shared/data/characters';

// HEXコードをRGBAに変換するユーティリティ関数
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
      className="w-full max-w-xs mx-auto drop-shadow-sm"
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
              rx={6}
              className={i === 0 ? 'fill-indigo-600' : 'fill-stone-300'}
            />
            <text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              className="fill-stone-800 text-[12px] font-bold"
            >
              {dmg}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 20}
              textAnchor="middle"
              className="fill-stone-500 text-[11px] font-medium"
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
        <p>制限時間は<strong className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{GAME_CONFIG.TURN_DURATION_SEC}秒</strong>。</p>
        <p><strong className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">2回連続パス</strong>で敗北となります。</p>
      </>
    ),
  },
  {
    title: '与ダメージの法則',
    content: (
      <>
        <p>短い単語ほど、ダメージは大きくなります。</p>
        <div className="mt-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
          <DamageChart />
        </div>
      </>
    ),
  },
  {
    title: '攻撃の反射',
    content: (
      <>
        <p>自分の番でないとき、相手の次の単語を予測して入力できます。</p>
        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl mt-2">
          <p className="text-stone-800 font-medium text-base">
            予測が的中すると「反射」が発動し、相手の攻撃をそのまま跳ね返せます。
          </p>
        </div>
      </>
    ),
  },
  {
    title: '必殺技「一閃」',
    content: (
      <>
        <p>
          HP<strong className="text-red-600 font-bold">30以下</strong>の時のみ発動可能な一撃必殺です。
        </p>
        <div className="bg-red-50/80 border border-red-200/80 p-3.5 rounded-xl mt-2 flex flex-col gap-1.5">
          <p className="font-bold text-red-800 text-base">
            条件: 「4文字」かつ「ん」で終わる言葉
          </p>
          <p className="text-xs text-red-700 leading-normal">
            ※条件を満たさずに「ん」で終わる言葉を出すと反則負けになります。
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'キャラクター',
    content: (
      <>
        <p className="text-xs text-stone-500 mb-3 font-medium">
          4人から1人を選んで対戦。それぞれ固有スキルを持っています。
        </p>
        <div className="flex flex-col gap-3">
          {characters.map((c) => {
            // ★直接キャラクターデータから色を取得するだけ！
            const baseColor = c.themeColor;
            const bgColor = hexToRgba(baseColor, 0.08);
            
            return (
              <div 
                key={c.id} 
                className="rounded-2xl border p-3.5 flex items-start gap-3 shadow-sm transition-all"
                style={{ 
                  backgroundColor: bgColor, 
                  borderColor: hexToRgba(baseColor, 0.3) 
                }}
              >
                {/* アバター画像 */}
                <div 
                  className="w-12 h-12 flex-shrink-0 bg-white rounded-full p-1 border-2 shadow-inner"
                  style={{ borderColor: baseColor }}
                >
                  <img 
                    src={`/images/${c.id}.png`} 
                    alt={c.name} 
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h4 className="text-lg font-bold text-stone-900 truncate">{c.name}</h4>
                    <span className="text-xs font-medium text-stone-500 truncate">{c.job}</span>
                  </div>
                  
                  <div className="flex mb-1.5">
                    <span 
                      className="text-xs font-bold px-2 py-0.5 rounded shadow-sm"
                      style={{ backgroundColor: baseColor, color: c.textColor }}
                    >
                      {c.skillName}
                    </span>
                  </div>
                  
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    {c.skillDescription}
                  </p>
                </div>
              </div>
            );
          })}
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

  useEffect(() => {
    const el = trackWrapperRef.current;
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
  }, [pageIndex, dragOffsetPx]);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between pr-10 flex-shrink-0">
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">ルール説明</h2>
        <span className="text-sm font-bold text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
          {pageIndex + 1} / {PAGES.length}
        </span>
      </div>

      {/* コンテンツ表示エリア（スワイプ領域） */}
      <div ref={trackWrapperRef} className="flex-1 min-h-0 overflow-hidden touch-pan-y relative">
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(-${pageIndex * 100}% + ${dragOffsetPx}px))`,
            transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {PAGES.map((p) => (
            <div key={p.title} className="w-full flex-shrink-0 h-full overflow-y-auto pr-1">
              <h3 className="font-bold text-indigo-700 text-xl mb-3">{p.title}</h3>
              <div className="text-base text-stone-700 leading-relaxed flex flex-col gap-3 pb-4">
                {p.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* フッター（ページ切り替えボタン） */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-stone-200 flex-shrink-0">
        <button
          onClick={goToPrev}
          disabled={isFirst}
          className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-0 disabled:pointer-events-none transition-colors"
        >
          ← 前へ
        </button>

        <div className="flex gap-1.5">
          {PAGES.map((p, i) => (
            <button
              key={p.title}
              onClick={() => setPageIndex(i)}
              aria-label={`${i + 1}ページ目へ`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === pageIndex ? 'w-6 bg-indigo-600' : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          disabled={isLast}
          className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-0 disabled:pointer-events-none transition-colors"
        >
          次へ →
        </button>
      </div>
    </div>
  );
}