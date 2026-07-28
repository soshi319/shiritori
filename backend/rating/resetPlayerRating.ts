// 特定プレイヤーのレートを初期値(1500)に戻すための単発スクリプト。
//
// 使い方（サーバーと同じ環境変数が使える場所で実行）:
//   $env:UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
//   $env:UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxxxxx"
//   deno run --allow-net --allow-env --env-file rating/resetPlayerRating.ts "プレイヤー名"
//
// 必要な環境変数:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

import { getRating, resetRating } from "./ratingStore.ts";

const name = Deno.args[0];

if (!name) {
  console.error(
    '使い方: deno run --allow-net --allow-env rating/resetPlayerRating.ts "プレイヤー名"',
  );
  Deno.exit(1);
}

const before = await getRating(name);
await resetRating(name);
const after = await getRating(name);

console.log(`"${name}" のレートをリセットしました: ${before} → ${after}`);
