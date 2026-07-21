// レートの保存・取得・ランキング取得を担当するモジュール。
// Upstash RedisのREST APIをfetchで直接叩く（トークンは環境変数のみで扱い、絶対にクライアントへ渡さない）。

const UPSTASH_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

const RATING_KEY = "shiritori:ratings"; // Sorted Set名（メンバー=プレイヤー名、スコア=レート）
const DEFAULT_RATING = 1500;
const K_FACTOR = 32;

async function upstashCommand<T>(command: (string | number)[]): Promise<T> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN が設定されていません",
    );
  }

  const response = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Upstashへのリクエストに失敗しました: ${response.status}`);
  }

  const data = (await response.json()) as { result: T };
  return data.result;
}

export async function getRating(name: string): Promise<number> {
  try {
    const score = await upstashCommand<string | null>([
      "ZSCORE",
      RATING_KEY,
      name,
    ]);
    return score !== null ? Math.round(Number(score)) : DEFAULT_RATING;
  } catch (error) {
    console.error("レート取得に失敗しました:", error);
    return DEFAULT_RATING;
  }
}

async function setRating(name: string, rating: number): Promise<void> {
  await upstashCommand(["ZADD", RATING_KEY, rating, name]);
}

function calculateEloDelta(
  myRating: number,
  opponentRating: number,
  didWin: boolean,
): number {
  const expectedScore = 1 /
    (1 + Math.pow(10, (opponentRating - myRating) / 400));
  const actualScore = didWin ? 1 : 0;
  return Math.round(K_FACTOR * (actualScore - expectedScore));
}

export type RatingChangeResult = {
  name: string;
  before: number;
  after: number;
  delta: number;
};

/**
 * 対戦終了後に呼び出す。勝者・敗者のレートを取得し、ELOレーティングで増減を計算して保存する。
 * Upstash未設定・通信エラー時はレート変動なし（1500のまま）として扱い、対戦自体は継続できるようにする。
 */
export async function applyMatchResult(
  winnerName: string,
  loserName: string,
): Promise<{ winner: RatingChangeResult; loser: RatingChangeResult }> {
  try {
    const [winnerBefore, loserBefore] = await Promise.all([
      getRating(winnerName),
      getRating(loserName),
    ]);

    const winnerDelta = calculateEloDelta(winnerBefore, loserBefore, true);
    const loserDelta = calculateEloDelta(loserBefore, winnerBefore, false);

    const winnerAfter = winnerBefore + winnerDelta;
    const loserAfter = loserBefore + loserDelta;

    await Promise.all([
      setRating(winnerName, winnerAfter),
      setRating(loserName, loserAfter),
    ]);

    return {
      winner: {
        name: winnerName,
        before: winnerBefore,
        after: winnerAfter,
        delta: winnerDelta,
      },
      loser: {
        name: loserName,
        before: loserBefore,
        after: loserAfter,
        delta: loserDelta,
      },
    };
  } catch (error) {
    console.error("レート更新に失敗しました:", error);
    return {
      winner: {
        name: winnerName,
        before: DEFAULT_RATING,
        after: DEFAULT_RATING,
        delta: 0,
      },
      loser: {
        name: loserName,
        before: DEFAULT_RATING,
        after: DEFAULT_RATING,
        delta: 0,
      },
    };
  }
}

export type LeaderboardEntry = { rank: number; name: string; rating: number };

export async function getLeaderboard(topN = 10): Promise<LeaderboardEntry[]> {
  try {
    // ZREVRANGEで上位N人を取得（レート降順）。WITHSCORESでレート値も一緒に返る
    const raw = await upstashCommand<string[]>([
      "ZREVRANGE",
      RATING_KEY,
      0,
      topN - 1,
      "WITHSCORES",
    ]);

    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      entries.push({
        rank: i / 2 + 1,
        name: raw[i],
        rating: Math.round(Number(raw[i + 1])),
      });
    }
    return entries;
  } catch (error) {
    console.error("ランキング取得に失敗しました:", error);
    return [];
  }
}

export async function getRank(name: string): Promise<number | null> {
  try {
    const rank = await upstashCommand<number | null>([
      "ZREVRANK",
      RATING_KEY,
      name,
    ]);
    return rank !== null ? rank + 1 : null; // ZREVRANKは0始まりなので順位表示用に+1する
  } catch (error) {
    console.error("順位取得に失敗しました:", error);
    return null;
  }
}
