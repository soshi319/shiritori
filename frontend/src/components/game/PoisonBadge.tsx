type PoisonBadgeProps = {
  poisonStacks: number;
};

export function PoisonBadge({ poisonStacks }: PoisonBadgeProps) {
  if (poisonStacks === 0) return null;

  return (
    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-purple-900/50 border border-purple-500 rounded-full text-xs animate-pulse">
      <span className="text-purple-300">☠️</span>
      <span className="text-purple-300 font-bold">毒×{poisonStacks}</span>
    </span>
  );
}