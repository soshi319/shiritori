// 特定プレイヤーのレートを、指定した任意の値に変更して保存するスクリプト。
// resetPlayerRating.ts は固定でDEFAULT_RATING(1500)に戻すのに対し、
// こちらは第2引数で好きな数値を指定できる。
//
// 使い方（サーバーと同じ環境変数が使える場所で実行）:
//   deno run --allow-net --allow-env --env-file rating/setPlayerRating.ts "プレイヤー名" 1800
//
// 必要な環境変数:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

import { getRating, setRatingExact } from "./ratingStore.ts";

const name = Deno.args[0];
const ratingArg = Deno.args[1];

if (!name || ratingArg === undefined) {
  console.error(
    '使い方: deno run --allow-net --allow-env --env-file rating/setPlayerRating.ts "プレイヤー名" <新しいレート値>',
  );
  Deno.exit(1);
}

const newRating = Number(ratingArg);

if (!Number.isFinite(newRating)) {
  console.error(`"${ratingArg}" は数値として解釈できません`);
  Deno.exit(1);
}

const before = await getRating(name);
await setRatingExact(name, Math.round(newRating));
const after = await getRating(name);

console.log(`"${name}" のレートを変更しました: ${before} → ${after}`);
