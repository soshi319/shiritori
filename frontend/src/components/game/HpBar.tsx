type HpBarProps = {
  name: string;
  currentHp: number;
  maxHp: number;
  badge?: React.ReactNode; // 【追加】名前の横に表示する任意の要素
};

export function HpBar({ name, currentHp, maxHp, badge }: HpBarProps) {
  const hpPercentage = Math.min(100, Math.max(0, (currentHp / maxHp) * 100));
  const isOverHealed = currentHp > maxHp;

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-center mb-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold">{name}</span>
          {badge}
        </div>
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