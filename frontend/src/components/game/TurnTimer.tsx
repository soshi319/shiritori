import { useEffect, useState } from 'react';

type TurnTimerProps = {
  turnId: number;       // ターンが変わるたびに違う値を渡してもらう（後で説明）
  duration?: number;    // 制限時間（秒）。省略時は15秒
  onTimeUp: () => void; // 時間切れになった時に親へ知らせる関数
};

export function TurnTimer({ turnId, duration = 15, onTimeUp }: TurnTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);

  useEffect(() => {
    setSecondsLeft(duration); // 新しいターンが始まったのでリセット

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
    <div className="w-full max-w-xs">
      <div className="flex justify-between mb-1 text-sm">
        <span>残り時間</span>
        <span className={isUrgent ? 'text-red-500 font-bold' : ''}>
          {secondsLeft}秒
        </span>
      </div>

      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isUrgent ? 'bg-red-500' : 'bg-yellow-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}