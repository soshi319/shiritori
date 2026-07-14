// backend/upload_dict.ts

// 既存の完璧な読み込み関数をそのまま再利用します！
import { loadDictionary } from "./dictionary/loadDictionary.ts";

// さきほど特定した本番データベースのURL
const KV_URL =
  "https://api.deno.com/v2/databases/c58e69b6-7ecd-461b-b15f-6abf2924dfbb/connect";
const kv = await Deno.openKv(KV_URL);

console.log("既存のロジックを使ってローカルで辞書を準備しています...");
// ここで自動ダウンロード〜除外処理〜Setの作成までが実行されます
const validWordsSet = await loadDictionary();
const words = Array.from(validWordsSet);

console.log(
  `\n準備完了！ 合計 ${words.length} 件の単語を本番のDeno KVに送信します...`,
);
console.log("※データ量が多いので数分かかります。そのままお待ちください。");

let count = 0;
for (const word of words) {
  // KVに保存（キー: ["jmdict", "りんご"]、値: true）
  await kv.set(["jmdict", word], true);

  count++;
  // 1000件ごとに進捗を表示
  if (count % 1000 === 0) {
    console.log(`${count} / ${words.length} 件 登録完了...`);
  }
}

console.log("\n🎉 すべての辞書データのKV登録が完了しました！");
