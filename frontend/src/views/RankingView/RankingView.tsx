import { useEffect, useState } from 'react';
import type { Screen } from '../../types/screen';
import { LEADERBOARD_API_URL, RATING_API_URL } from 'shared/config/serverConfig';

type RankingViewProps = {
  changeScreen: (screen: Screen) => void;
  playerName: string;
};

type LeaderboardEntry = { rank: number; name: string; rating: number };
type MyRating = { name: string; rating: number; rank: number | null };

export function RankingView({ changeScreen, playerName }: RankingViewProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRating, setMyRating] = useState<MyRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRanking() {
      setIsLoading(true);
      setError(null);

      try {
        const [leaderboardRes, myRatingRes] = await Promise.all([
          fetch(`${LEADERBOARD_API_URL}?limit=10`),
          fetch(`${RATING_API_URL}?name=${encodeURIComponent(playerName)}`),
        ]);

        const leaderboardData = (await leaderboardRes.json()) as { leaderboard: LeaderboardEntry[] };
        const myRatingData = (await myRatingRes.json()) as MyRating;

        if (!cancelled) {
          setLeaderboard(leaderboardData.leaderboard ?? []);
          setMyRating(myRatingData);
        }
      } catch {
        if (!cancelled) {
          setError('ランキングの取得に失敗しました。通信環境を確認して、もう一度試してください。');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchRanking();
    return () => {
      cancelled = true;
    };
  }, [playerName]);

  const isMyRankInTop10 = myRating?.rank !== null && myRating?.rank !== undefined && myRating.rank <= 10;

  return (
    <div className="fixed inset-0 flex flex-col items-center gap-6 p-6 w-full bg-stone-100 text-stone-800 overflow-y-auto">
      <div className="w-full max-w-md flex items-center justify-between">
        <button
          onClick={() => changeScreen('modeSelect')}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          ← モード選択へ戻る
        </button>
      </div>

      <h1 className="text-3xl font-extrabold tracking-normal text-stone-800">ランキング</h1>

      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <div className="animate-spin h-6 w-6 border-4 border-stone-400 rounded-full border-t-stone-700" />
          <p className="text-sm text-stone-500">読み込み中...</p>
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      ) : (
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-8 px-4">
                まだレート対戦の記録がありません。オンライン対戦で最初のランカーになりましょう！
              </p>
            ) : (
              leaderboard.map((entry) => {
                const isMe = entry.name === playerName;
                return (
                  <div
                    key={`${entry.rank}-${entry.name}`}
                    className={`flex items-center justify-between px-4 py-3 border-b border-stone-100 last:border-b-0 ${
                      isMe ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-sm font-bold text-stone-400 text-right">
                        {entry.rank}
                      </span>
                      <span className={`text-base font-semibold ${isMe ? 'text-indigo-700' : 'text-stone-800'}`}>
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-base font-bold text-stone-700">{entry.rating}</span>
                  </div>
                );
              })
            )}
          </div>

          {myRating && !isMyRankInTop10 && (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-indigo-400 text-right">
                  {myRating.rank ?? '-'}
                </span>
                <span className="text-base font-semibold text-indigo-700">{myRating.name}</span>
              </div>
              <span className="text-base font-bold text-indigo-700">{myRating.rating}</span>
            </div>
          )}

          <p className="text-xs text-stone-400 text-center">
            ランキングはオンライン対戦（レートバトル）の結果のみが反映されます。練習モード・CPU対戦は対象外です。
          </p>
        </div>
      )}
    </div>
  );
}
