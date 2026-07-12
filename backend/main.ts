import { roomManager } from "./rooms/roomManager.ts";

Deno.serve({ port: 8000 }, (req) => {
  // WebSocketのアップグレードリクエストかどうかを判定
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);

    // 接続されたソケットをRoomManagerに引き渡す（あとは全部やってくれる！）
    roomManager.handleConnection(socket);

    return response;
  }

  // 通常のHTTPアクセスが来た場合
  return new Response("しりとりバトル WebSocketサーバー稼働中", {
    status: 200,
  });
});

console.log("WebSocketサーバーがポート8000で起動しました！");
