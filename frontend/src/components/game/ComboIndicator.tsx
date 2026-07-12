type ComboIndicatorProps = {
  comboCount: number;
};

export function ComboIndicator({ comboCount }: ComboIndicatorProps) {
  if (comboCount === 0) return null;

  return (
    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-orange-900/50 border border-orange-500 rounded-full text-xs">
      <span className="text-orange-400">🔥</span>
      <span className="text-orange-300 font-extrabold">×{comboCount}</span>
    </span>
  );
}