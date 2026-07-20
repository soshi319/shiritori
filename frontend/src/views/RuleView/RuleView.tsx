import { useState } from 'react';
import { GAME_CONFIG } from 'shared/config/gameConfig';

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
        <p>
          交互にしりとりの単語を入力し合い、相手のHPを0にすれば勝利です。
        </p>
        <p>
          前の単語の最後の文字から始まる言葉だけが入力できます。すでに使った言葉を入力するとその時点で敗北です。
        </p>
        <p>
          1ターンの制限時間は<strong className="text-stone-900">{GAME_CONFIG.TURN_DURATION_SEC}秒</strong>。時間内に入力しないとターンがパスされ、
          <strong className="text-stone-900">2回連続でパス</strong>すると、その時点で敗北になります。
        </p>
      </>
    ),
  },
  {
    title: 'ダメージ計算',
    content: (
      <>
        <p>
          ダメージは「攻撃力 × 減衰率<sup>文字数-1</sup>」で決まります。文字数が少ないほど、ダメージは指数関数的に大きくなります。
        </p>
        <DamageChart />
        <p className="text-sm text-stone-500 text-center">
          ※ グラフは説明用の一般例です。実際の攻撃力・減衰率はキャラクターごとに異なります。
        </p>
        <p>
          1文字の単語は最大威力ですが、しりとりで1文字を続けるのは至難の業。短期決戦を狙うか、安全に長い単語で立ち回るかが戦略の鍵になります。
        </p>
      </>
    ),
  },
  {
    title: '反射（カウンター）',
    content: (
      <>
        <p>
          自分のターンでなくても、次に相手が繰り出すであろう単語をあらかじめ予測して入力しておくことができます。
        </p>
        <p>
          その予測が実際の相手の単語とぴったり一致していると「反射」が発動し、相手の攻撃がそのまま相手自身に跳ね返ります。
        </p>
        <p>
          リアルタイムに相手の入力を見て真似するのではなく、「相手なら次にどんな言葉を選ぶか」を読む心理戦です。
        </p>
      </>
    ),
  },
  {
    title: '必殺技「一閃」',
    content: (
      <>
        <p>
          自分のHPが<strong className="text-stone-900">30以下</strong>の時に限り、
          ちょうど<strong className="text-stone-900">4文字</strong>で「ん」に終わる言葉を出すと必殺技「一閃」が発動し、
          大ダメージが確定で入ります。
        </p>
        <p className="text-red-700 font-semibold">
          注意：条件（HP30以下・4文字・んで終わる）を満たさずに「ん」で終わる言葉を言ってしまうと、
          必殺技にはならず、そのまま反則負けになります。
        </p>
      </>
    ),
  },
  {
    title: '先攻・後攻',
    content: (
      <>
        <p>対戦開始時、先攻・後攻はランダムに決定されます。</p>
        <p>
          先に攻められる後攻側の不利を補うため、後攻には最大HP+
          <strong className="text-stone-900">{GAME_CONFIG.SECOND_TURN_HP_BONUS}</strong>
          のボーナス（オーバーヒール）が付与されます。
        </p>
      </>
    ),
  },
  {
    title: 'キャラクター',
    content: (
      <>
        <p>4人のキャラクターから1人を選んで対戦します。それぞれHP・攻撃力・減衰率に加えて、固有スキルを持っています。</p>
        <p>
          固有スキルの詳しい内容は、キャラクター選択画面、または対戦中にキャラクターをタップすると確認できます。
        </p>
      </>
    ),
  },
];

export function RuleView() {
  const [pageIndex, setPageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const isFirst = pageIndex === 0;
  const isLast = pageIndex === PAGES.length - 1;
  const page = PAGES[pageIndex];

  function goToPrev() {
    setPageIndex((prev) => Math.max(0, prev - 1));
  }

  function goToNext() {
    setPageIndex((prev) => Math.min(PAGES.length - 1, prev + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) goToNext();
    else if (diff < -50) goToPrev();
    setTouchStartX(null);
  }

  return (
    <div
      className="flex flex-col gap-5 min-h-[22rem]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between pr-10">
        <h2 className="text-2xl font-bold text-stone-900">ルール説明</h2>
        <span className="text-sm font-medium text-stone-400 whitespace-nowrap">
          {pageIndex + 1} / {PAGES.length}
        </span>
      </div>

      <section className="flex-1 flex flex-col gap-3">
        <h3 className="font-bold text-indigo-700 text-xl">{page.title}</h3>
        <div className="text-lg text-stone-700 leading-loose flex flex-col gap-4">
          {page.content}
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone-200">
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
