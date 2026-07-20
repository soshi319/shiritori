import { useEffect, useState } from 'react';

type HpBarProps = {
  name: string;
  currentHp: number;
  maxHp: number;
  badge?: React.ReactNode;
};

export function HpBar({ name, currentHp, maxHp, badge }: HpBarProps) {
  const [prevHp, setPrevHp] = useState(currentHp);

  useEffect(() => {
    if (currentHp < prevHp) {
      const timer = setTimeout(() => {
        setPrevHp(currentHp);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setPrevHp(currentHp);
    }
  }, [currentHp, prevHp]);

  const isOverHealed = currentHp > maxHp;

  // バー全体が表す基準値（オーバーヒール中は currentHp、それ以外は maxHp を基準にする）
  const barScale = Math.max(currentHp, maxHp, 1); // 0除算を避けるため最低1を保証

  // 緑のバー：maxHpを超えない範囲だけを表示
  const currentGreenPercentage = Math.min(100, Math.max(0, (Math.min(currentHp, maxHp) / barScale) * 100));
  const prevGreenPercentage = Math.min(100, Math.max(0, (Math.min(prevHp, maxHp) / barScale) * 100));

  // 水色のバー：maxHpを超えた分だけの幅
  const overHealPercentage = isOverHealed
    ? Math.max(0, ((currentHp - maxHp) / barScale) * 100)
    : 0;

  return (
      <div className="w-full max-w-md text-zinc-900">
        {/* 変更箇所: flex-nowrap と gap-1.5（少し隙間を詰める）を追加 */}
        <div className="flex justify-between items-center mb-1 text-sm flex-nowrap gap-1.5">
          
          {/* 左側：名前とバッジ。ここも flex-nowrap を指定して改行を防止 */}
          <div className="flex items-center flex-nowrap gap-1.5 min-w-0 overflow-hidden">
            <span className="font-extrabold whitespace-nowrap shrink-0">{name}</span>
            <div className="flex items-center flex-nowrap gap-1 overflow-hidden">
              {badge}
            </div>
          </div>

          {/* 右側：HP表示。whitespace-nowrap (文字の改行禁止) と shrink-0 (縮小禁止) を追加 */}
          <span className={`${isOverHealed ? 'text-cyan-600 font-bold' : 'font-semibold'} whitespace-nowrap shrink-0 text-xs sm:text-sm`}>
            {currentHp} / {maxHp}
          </span>
        </div>

        <div className="relative w-full h-4 bg-zinc-300 rounded-full overflow-hidden border border-zinc-400/60 shadow-inner">
        {/* 1. ダメージ残像バー（オレンジ色）：後ろに配置 */}
        <div
          className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-500 ease-out"
          style={{ width: `${prevGreenPercentage}%` }}
        />

        {/* 2. 実際のHPバー（緑）：maxHpの範囲内だけ表示 */}
        <div
          className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-150 ease-out"
          style={{ width: `${currentGreenPercentage}%` }}
        />

        {/* 3. オーバーヒール分（水色）：緑の右側に継ぎ足す形で表示 */}
        {isOverHealed && (
          <div
            className="absolute top-0 h-full bg-cyan-400 transition-all duration-150 ease-out"
            style={{
              left: `${currentGreenPercentage}%`,
              width: `${overHealPercentage}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}