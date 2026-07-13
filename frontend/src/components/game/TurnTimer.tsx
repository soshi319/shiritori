import { useEffect, useState } from 'react';

type TurnTimerProps = {
  turnId: number;
  duration?: number;
  onTimeUp: () => void;
};

export function TurnTimer({ turnId, duration = 15, onTimeUp }: TurnTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);

  useEffect(() => {
    setSecondsLeft(duration);

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [turnId, duration, onTimeUp]);

  const percentage = (secondsLeft / duration) * 100;
  const isUrgent = secondsLeft <= 5;

  return (
    <div className="w-full max-w-xs text-zinc-900">
      <div className="flex justify-between mb-1 text-sm font-medium">
        <span className="text-zinc-700">残り時間</span>
        <span className={isUrgent ? 'text-red-600 font-bold animate-pulse' : 'font-semibold'}>
          {secondsLeft}秒
        </span>
      </div>

      <div className="w-full h-3 bg-zinc-300 rounded-full overflow-hidden border border-zinc-400/60 shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isUrgent ? 'bg-red-500' : 'bg-amber-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}