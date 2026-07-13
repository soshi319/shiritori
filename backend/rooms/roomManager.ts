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
  private dictionary: Set<string> = new Set();

  public setDictionary(dictionary: Set<string>) {
    this.dictionary = dictionary;
  }

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

  private handleJoinRoom(socket: WebSocket, name: string, characterId: string) {
    if (this.waitingPlayer) {
      const p1 = this.waitingPlayer;
      const p2 = { socket, name, characterId };
      this.waitingPlayer = null;

      const roomId = crypto.randomUUID();
      const gameRoom = new GameRoom(roomId, p1, p2, this.dictionary, () => {
        this.activeRooms.delete(roomId);
      });

      this.activeRooms.set(roomId, gameRoom);
      gameRoom.start();
    } else {
      this.waitingPlayer = { socket, name, characterId };
    }
  }
}

// サーバー全体で1つのインスタンスを使い回すためにエクスポート
export const roomManager = new RoomManager();
