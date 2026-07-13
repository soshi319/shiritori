type ComboIndicatorProps = {
  comboCount: number;
};

export function ComboIndicator({ comboCount }: ComboIndicatorProps) {
  if (comboCount === 0) return null;

  return (
    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-orange-100 border border-orange-300 text-orange-700 rounded-full text-xs font-bold shadow-sm">
      <span>🔥</span>
      <span className="tracking-wide">×{comboCount}</span>
    </span>
  );
}