import { roomManager } from "./rooms/roomManager.ts";
import { loadDictionary } from "./dictionary/loadDictionary.ts";
import { isKnownWord } from "shared/logic/shiritoriValidator.ts";

const dictionary = await loadDictionary();
roomManager.setDictionary(dictionary);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ★Renderなどのホスティングサービスは、PORT環境変数でリッスンすべきポートを指定してくる。
//   ローカル開発では環境変数が無いので、その場合は従来通り8000番を使う。
const port = Number(Deno.env.get("PORT")) || 8000;

Deno.serve({ port }, (req) => {
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
    const exists = isKnownWord(word, dictionary);

    return new Response(JSON.stringify({ exists }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("しりとりバトル WebSocketサーバー稼働中", {
    status: 200,
    headers: corsHeaders,
  });
});

console.log(`WebSocketサーバーがポート${port}で起動しました！`);
