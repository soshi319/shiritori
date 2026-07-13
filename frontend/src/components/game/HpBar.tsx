type HpBarProps = {
  name: string;
  currentHp: number;
  maxHp: number;
  badge?: React.ReactNode;
};

export function HpBar({ name, currentHp, maxHp, badge }: HpBarProps) {
  const hpPercentage = Math.min(100, Math.max(0, (currentHp / maxHp) * 100));
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

      <div className="w-full h-4 bg-zinc-300 rounded-full overflow-hidden border border-zinc-400/60 shadow-inner">
        <div
          className={`h-full transition-all duration-300 ${
            isOverHealed ? 'bg-cyan-500' : 'bg-green-500'
          }`}
          style={{ width: `${hpPercentage}%` }}
        />
      </div>
    </div>
  );
}