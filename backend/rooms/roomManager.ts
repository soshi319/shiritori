import { GameRoom } from "./gameRoom.ts";
import type { ClientMessage } from "../../shared/types/messageTypes.ts";

type WaitingPlayer = {
  socket: WebSocket;
  name: string;
  characterId: string;
};

export class RoomManager {
  private waitingPlayer: WaitingPlayer | null = null;
  private activeRooms: Map<string, GameRoom> = new Map();

  /**
   * 新しいWebSocket接続を受け取る
   */
  public handleConnection(socket: WebSocket) {
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ClientMessage;

        if (message.type === "JOIN_ROOM") {
          this.handleJoinRoom(
            socket,
            message.payload.playerName,
            message.payload.characterId,
          );
        }
      } catch (error) {
        console.error("メッセージの解析に失敗しました:", error);
      }
    };

    socket.onclose = () => {
      // 待機中のプレイヤーが切断した場合は待機列をクリア
      if (this.waitingPlayer?.socket === socket) {
        this.waitingPlayer = null;
      }
    };
  }

  /**
   * マッチング処理
   */
  private handleJoinRoom(socket: WebSocket, name: string, characterId: string) {
    if (this.waitingPlayer) {
      // 既に待っている人がいればマッチング成立
      const p1 = this.waitingPlayer;
      const p2 = { socket, name, characterId };

      // 待機列をリセット
      this.waitingPlayer = null;

      // ユニークなルームIDを生成して部屋を作成
      const roomId = crypto.randomUUID();

      // 部屋が終了した時にMapから削除するコールバックを渡す
      const gameRoom = new GameRoom(roomId, p1, p2, () => {
        this.activeRooms.delete(roomId);
      });

      this.activeRooms.set(roomId, gameRoom);

      // 試合開始
      gameRoom.start();
    } else {
      // 誰もいなければ待機列に入る
      this.waitingPlayer = { socket, name, characterId };
    }
  }
}

// サーバー全体で1つのインスタンスを使い回すためにエクスポート
export const roomManager = new RoomManager();
