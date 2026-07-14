// backend/main.ts

import { roomManager } from "./rooms/roomManager.ts";
import { loadDictionary } from "./dictionary/loadDictionary.ts";
import { isKnownWord } from "shared/logic/shiritoriValidator.ts";

// KVの初期化
const kv = await Deno.openKv();
// モード切替の環境変数（なければ false）
const useKv = Deno.env.get("USE_KV_DICTIONARY") === "true";

let dictionary: Set<string> | null = null;
if (!useKv) {
  console.log("【モード】メモリ読み込みを使用します");
  dictionary = await loadDictionary();
  roomManager.setDictionary(dictionary);
} else {
  console.log("【モード】Deno KV を使用します");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve({ port: 8000 }, async (req) => { // async を追加
  const url = new URL(req.url);

  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    roomManager.handleConnection(socket);
    return response;
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (url.pathname === "/api/check-word" && req.method === "GET") {
    const word = url.searchParams.get("word") ?? "";
    let exists = false;

    if (useKv) {
      // KVモード: KVデータベースへ直接問い合わせ
      const result = await kv.get(["jmdict", word]);
      exists = result.value === true;
    } else if (dictionary) {
      // 従来モード: メモリ上のSetを検索
      exists = isKnownWord(word, dictionary);
    }

    return new Response(JSON.stringify({ exists }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("サーバー稼働中", { headers: corsHeaders });
});
