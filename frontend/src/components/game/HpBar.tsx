type HpBarProps = {
  name: string;
  currentHp: number;
  maxHp: number;
};

export function HpBar({ name, currentHp, maxHp }: HpBarProps) {
  // オーバーヒール中はバーが100%を超えないよう、表示上は100%に留める
  const hpPercentage = Math.min(100, Math.max(0, (currentHp / maxHp) * 100));
  const isOverHealed = currentHp > maxHp;

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between mb-1 text-sm">
        <span className="font-bold">{name}</span>
        <span className={isOverHealed ? 'text-cyan-300 font-bold' : ''}>
          {currentHp} / {maxHp}
        </span>
      </div>

      <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
        <div
          className={`h-full transition-all duration-300 ${
            isOverHealed ? 'bg-cyan-400' : 'bg-green-500'
          }`}
          style={{ width: `${hpPercentage}%` }}
        />
      </div>
    </div>
  );
}