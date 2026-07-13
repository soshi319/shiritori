import { roomManager } from "./rooms/roomManager.ts";
import { loadDictionary } from "./dictionary/loadDictionary.ts";

const dictionary = await loadDictionary();
roomManager.setDictionary(dictionary);

Deno.serve({ port: 8000 }, (req) => {
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    roomManager.handleConnection(socket);
    return response;
  }

  return new Response("しりとりバトル WebSocketサーバー稼働中", {
    status: 200,
  });
});

console.log("WebSocketサーバーがポート8000で起動しました！");
