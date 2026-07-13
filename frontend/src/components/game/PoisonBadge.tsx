type PoisonBadgeProps = {
  poisonStacks: number;
};

export function PoisonBadge({ poisonStacks }: PoisonBadgeProps) {
  if (poisonStacks === 0) return null;

  return (
    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-purple-100 border border-purple-300 text-purple-700 rounded-full text-xs font-semibold shadow-sm animate-pulse">
      <span>☠️</span>
      <span className="tracking-wide">毒×{poisonStacks}</span>
    </span>
  );
}