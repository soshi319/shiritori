// 特定プレイヤーのレートデータを完全に削除するための単発スクリプト。
// resetPlayerRating.ts と違い、1500にリセットするのではなく
// ランキング（Sorted Set）からエントリ自体を削除する。
// 削除後、そのプレイヤーが再度対戦すればまた新規にDEFAULT_RATING(1500)から登録される。
//
// 使い方（サーバーと同じ環境変数が使える場所で実行）:
//   $env:UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
//   $env:UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxxxxx"
//   deno run --allow-net --allow-env --env-file rating/deletePlayerRating.ts "プレイヤー名"
//
// 必要な環境変数:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

import { getRating, removeRating } from "./ratingStore.ts";

const name = Deno.args[0];

if (!name) {
  console.error(
    '使い方: deno run --allow-net --allow-env --env-file rating/deletePlayerRating.ts "プレイヤー名"',
  );
  Deno.exit(1);
}

const before = await getRating(name);
await removeRating(name);

console.log(
  `"${name}" のレートデータを削除しました（削除前のレート: ${before}）`,
);
