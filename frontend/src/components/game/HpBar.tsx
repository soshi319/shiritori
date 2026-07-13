import { useEffect, useState } from 'react';

type HpBarProps = {
  name: string;
  currentHp: number;
  maxHp: number;
  badge?: React.ReactNode;
};

export function HpBar({ name, currentHp, maxHp, badge }: HpBarProps) {
  // アニメーション用に「少し前のHP」を記憶しておくState
  const [prevHp, setPrevHp] = useState(currentHp);

  useEffect(() => {
    if (currentHp < prevHp) {
      // ダメージを受けた場合：0.4秒待ってから、後ろのオレンジバーを現在のHPまで減らす
      const timer = setTimeout(() => {
        setPrevHp(currentHp);
      }, 400); // ここの数字（ミリ秒）で右辺が追いかけ始めるまでの時間を調整できます
      
      return () => clearTimeout(timer);
    } else {
      // 回復や初期化の場合は、すぐに同じ値にする（緑と一緒に増える）
      setPrevHp(currentHp);
    }
  }, [currentHp, prevHp]);

  // パーセンテージの計算
  const currentPercentage = Math.min(100, Math.max(0, (currentHp / maxHp) * 100));
  const prevPercentage = Math.min(100, Math.max(0, (prevHp / maxHp) * 100));
  const isOverHealed = currentHp > maxHp;

  return (
    <div className="w-full max-w-md text-zinc-900">
      <div className="flex justify-between items-center mb-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-extrabold">{name}</span>
          {badge}
        </div>
        <span className={isOverHealed ? 'text-cyan-600 font-bold' : 'font-semibold'}>
          {currentHp} / {maxHp}
        </span>
      </div>

      {/* バー全体の背景 (relativeを追加して、中のバーを絶対位置で重ねられるようにする) */}
      <div className="relative w-full h-4 bg-zinc-300 rounded-full overflow-hidden border border-zinc-400/60 shadow-inner">
        
        {/* 1. ダメージ残像バー（オレンジ色）：後ろに配置され、ゆっくり(duration-500)減る */}
        <div
          className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-500 ease-out"
          style={{ width: `${prevPercentage}%` }}
        />

        {/* 2. 実際のHPバー（緑/シアン）：手前に配置され、素早く(duration-150)減る */}
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-150 ease-out ${
            isOverHealed ? 'bg-cyan-500' : 'bg-green-500'
          }`}
          style={{ width: `${currentPercentage}%` }}
        />
      </div>
    </div>
  );
}