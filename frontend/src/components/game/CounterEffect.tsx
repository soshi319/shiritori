export type EffectData = {
  id: number; // 発生ごとに違う値にすることで、同じ演出が連続で来ても毎回アニメーションし直させる
  type: 'reflect' | 'hit';
  damage: number;
};

type CounterEffectProps = {
  effect: EffectData | null;
};

export function CounterEffect({ effect }: CounterEffectProps) {
  if (!effect) return null;

  const isReflect = effect.type === 'reflect';

  return (
    <div
      key={effect.id}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
    >
      <div
        className={`flex flex-col items-center animate-popIn ${
          isReflect ? 'animate-shake' : ''
        }`}
      >
        <span
          className={`text-4xl font-extrabold drop-shadow-lg ${
            isReflect ? 'text-red-500' : 'text-yellow-300'
          }`}
        >
          {isReflect ? '反射！' : 'ヒット！'}
        </span>
        <span className="text-2xl font-bold text-white drop-shadow-lg">
          -{effect.damage}
        </span>
      </div>
    </div>
  );
}