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
        // payload 内の isCpuMode フラグを許容するため、一時的に any でパースします
        const message = JSON.parse(event.data) as any;

        if (message.type === "PING") {
          socket.send(JSON.stringify({ type: "PONG" }));
          return;
        }

        if (message.type === "JOIN_ROOM") {
          this.handleJoinRoom(
            socket,
            message.payload.playerName,
            message.payload.characterId,
            !!message.payload.isCpuMode, // CPU戦フラグを boolean として抽出
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

  private handleJoinRoom(
    socket: WebSocket,
    name: string,
    characterId: string,
    isCpuMode: boolean,
  ) {
    // 【追加】CPU対戦モードの場合：他のプレイヤーを待たずに即座に専用の部屋を作成
    if (isCpuMode) {
      const roomId = crypto.randomUUID();
      const p1 = { socket, name, characterId };

      // CPUのキャラクターをランダムに選出 (A:アレス, B:バステト, C:チヨ, D:ドロシー)
      const cpuChars = ["A", "B", "C", "D"];
      const randomChar = cpuChars[Math.floor(Math.random() * cpuChars.length)];

      const p2 = {
        socket: {} as WebSocket, // ダミーの空オブジェクトを渡す（gameRoom側で安全に送信をスキップします）
        name: "CPU (敵)",
        characterId: randomChar,
      };

      // 第6引数に true を渡して GameRoom を作成
      const gameRoom = new GameRoom(
        roomId,
        p1,
        p2,
        this.dictionary,
        () => {
          this.activeRooms.delete(roomId);
        },
        true, // isCpuMode = true
      );

      this.activeRooms.set(roomId, gameRoom);
      gameRoom.start();
      return;
    }

    // 通常のオンライン対戦モード（既存のマッチングロジック）
    if (this.waitingPlayer) {
      const p1 = this.waitingPlayer;
      const p2 = { socket, name, characterId };
      this.waitingPlayer = null;

      const roomId = crypto.randomUUID();
      const gameRoom = new GameRoom(
        roomId,
        p1,
        p2,
        this.dictionary,
        () => {
          this.activeRooms.delete(roomId);
        },
        false, // isCpuMode = false
      );

      this.activeRooms.set(roomId, gameRoom);
      gameRoom.start();
    } else {
      this.waitingPlayer = { socket, name, characterId };
    }
  }
}

export const roomManager = new RoomManager();
