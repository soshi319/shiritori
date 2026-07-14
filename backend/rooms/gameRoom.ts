import type {
  ClientMessage,
  PlayerState,
  ServerMessage,
} from "shared/types/messageTypes.ts";
import { characters } from "shared/data/characters.ts";
import {
  isKnownWord,
  normalizeWordForComparison,
  validateWord,
} from "shared/logic/shiritoriValidator.ts";
import { resolveTurn } from "../game/turnResolver.ts";
import { GAME_CONFIG } from "shared/config/gameConfig.ts";

type Client = {
  socket: WebSocket;
  state: PlayerState;
};

export class GameRoom {
  private clients: Map<string, Client> = new Map();
  private turnId = 0;
  private currentWord = "しりとり";
  private usedWords: Set<string> = new Set(["しりとり"]);
  private activePlayerId!: string;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private activeWord: string | null = null;
  private predictedWord: string | null = null;
  private consecutiveTimeouts: Map<string, number> = new Map();

  constructor(
    public roomId: string,
    p1: { socket: WebSocket; name: string; characterId: string },
    p2: { socket: WebSocket; name: string; characterId: string },
    private dictionary: Set<string>,
    private onRoomClose: () => void,
  ) {
    this.addClient(crypto.randomUUID(), p1);
    this.addClient(crypto.randomUUID(), p2);

    for (const [id, client] of this.clients.entries()) {
      client.socket.onmessage = (e) => this.handleMessage(id, e.data);
      client.socket.onclose = () => this.handleDisconnect(id);
    }
  }

  private addClient(
    id: string,
    p: { socket: WebSocket; name: string; characterId: string },
  ) {
    const char = characters.find((c) => c.id === p.characterId)!;
    this.clients.set(id, {
      socket: p.socket,
      state: {
        id,
        name: p.name,
        characterId: p.characterId,
        hp: char.maxHp,
        maxHp: char.maxHp,
        hasEndured: false,
        poisonStacks: 0,
        comboCount: 0,
        lastWordLength: null,
      },
    });
    this.consecutiveTimeouts.set(id, 0);
  }

  private broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(data);
      }
    }
  }

  public start() {
    const playerIds = Array.from(this.clients.keys());
    this.activePlayerId = playerIds[Math.random() < 0.5 ? 0 : 1];

    for (const playerId of playerIds) {
      if (playerId !== this.activePlayerId) {
        const client = this.clients.get(playerId)!;
        client.state.hp += GAME_CONFIG.SECOND_TURN_HP_BONUS;
      }
    }

    const me1 = this.clients.get(playerIds[0])!.state;
    const me2 = this.clients.get(playerIds[1])!.state;

    this.clients.get(playerIds[0])!.socket.send(JSON.stringify(
      {
        type: "MATCHED",
        payload: {
          roomId: this.roomId,
          me: me1,
          opponent: me2,
          initialWord: this.currentWord,
          firstPlayerId: this.activePlayerId,
        },
      } satisfies ServerMessage,
    ));

    this.clients.get(playerIds[1])!.socket.send(JSON.stringify(
      {
        type: "MATCHED",
        payload: {
          roomId: this.roomId,
          me: me2,
          opponent: me1,
          initialWord: this.currentWord,
          firstPlayerId: this.activePlayerId,
        },
      } satisfies ServerMessage,
    ));

    this.startTurn();
  }

  private startTurn() {
    this.turnId++;
    this.activeWord = null;
    this.predictedWord = null;

    this.broadcast({
      type: "TURN_START",
      payload: {
        turnId: this.turnId,
        activePlayerId: this.activePlayerId,
        previousWord: this.currentWord,
        duration: GAME_CONFIG.TURN_DURATION_SEC,
      },
    });

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(
      () => this.handleTimeUp(),
      GAME_CONFIG.TURN_DURATION_SEC * 1000,
    );
  }

  private handleMessage(senderId: string, data: string) {
    const message = JSON.parse(data) as ClientMessage;
    if (message.type !== "SUBMIT_WORD") return;

    const word = message.payload.word;

    // 攻撃側（アクティブプレイヤー）の単語だけ、送信直後に辞書チェックする
    if (senderId === this.activePlayerId) {
      const hasDictionary = this.dictionary.size > 0;

      if (hasDictionary && !isKnownWord(word, this.dictionary)) {
        this.clients.get(senderId)!.socket.send(
          JSON.stringify(
            {
              type: "WORD_REJECTED",
              payload: {
                word,
                message:
                  `「${word}」は辞書に見つかりませんでした。別の単語を入力してください。`,
              },
            } satisfies ServerMessage,
          ),
        );
        return;
      }

      this.activeWord = word;
    } else {
      this.predictedWord = word;
    }

    this.clients.get(senderId)!.socket.send(
      JSON.stringify({ type: "WAIT_OPPONENT" } satisfies ServerMessage),
    );

    if (this.activeWord && this.predictedWord) {
      this.resolveCurrentTurn();
    }
  }

  private handleTimeUp() {
    if (this.activeWord) {
      this.resolveCurrentTurn();
      return;
    }

    const opponent = Array.from(this.clients.values()).find((c) =>
      c.state.id !== this.activePlayerId
    )!;

    const timeoutCount =
      (this.consecutiveTimeouts.get(this.activePlayerId) ?? 0) + 1;
    this.consecutiveTimeouts.set(this.activePlayerId, timeoutCount);

    if (timeoutCount >= 2) {
      this.endGame(opponent.state.id, "time_up");
      return;
    }

    this.broadcastTurnResult(
      "",
      false,
      false,
      null,
      null,
      "時間切れのため、ターンをパスしました",
    );

    this.activePlayerId = opponent.state.id;
    this.startTurn();
  }

  private resolveCurrentTurn() {
    if (this.timer) clearTimeout(this.timer);

    const isReflected = this.predictedWord !== null &&
      this.activeWord !== null &&
      normalizeWordForComparison(this.predictedWord) ===
        normalizeWordForComparison(this.activeWord);

    const activeClient = this.clients.get(this.activePlayerId)!;
    const opponentClient = Array.from(this.clients.values()).find((c) =>
      c.state.id !== this.activePlayerId
    )!;

    const valResult = validateWord(
      this.activeWord!,
      this.currentWord,
      this.usedWords,
      activeClient.state.hp,
      activeClient.state.characterId,
    );

    if (!valResult.isValid) {
      if (valResult.failureReason === "nounEnding") {
        this.broadcastTurnResult(
          this.activeWord!,
          false,
          false,
          null,
          null,
          valResult.errorMessage,
        );
        this.endGame(opponentClient.state.id, "bakudan_failed");
        return;
      }

      this.broadcastTurnResult(
        this.activeWord!,
        false,
        false,
        null,
        null,
        valResult.errorMessage,
      );
      this.activePlayerId = opponentClient.state.id;
      this.startTurn();
      return;
    }

    this.usedWords.add(this.activeWord!);
    this.currentWord = this.activeWord!;

    const resResult = resolveTurn(
      this.activeWord!,
      valResult.isBakudan,
      isReflected,
      activeClient.state,
      opponentClient.state,
    );

    if (valResult.triggersPoison) resResult.nextOpponentState.poisonStacks += 1;

    activeClient.state = resResult.nextMyState;
    opponentClient.state = resResult.nextOpponentState;

    if (resResult.enduredPlayerId) {
      this.activePlayerId = resResult.enduredPlayerId;
      this.currentWord = "アレスの足搔き・あ";
      this.usedWords.add(this.currentWord);
    } else {
      this.activePlayerId = opponentClient.state.id;
    }

    this.broadcastTurnResult(
      this.activeWord!,
      true,
      valResult.isBakudan,
      resResult.effect,
      resResult.poisonDamage,
      null,
    );

    if (resResult.gameOverReason) {
      const winnerId = activeClient.state.hp > 0
        ? activeClient.state.id
        : opponentClient.state.id;
      this.endGame(winnerId, resResult.gameOverReason);
    } else {
      this.startTurn();
    }
  }

  private handleDisconnect(disconnectedId: string) {
    if (this.timer) clearTimeout(this.timer);
    const opponent = Array.from(this.clients.values()).find((c) =>
      c.state.id !== disconnectedId
    );
    if (opponent) this.endGame(opponent.state.id, "disconnect");
  }

  private broadcastTurnResult(
    word: string,
    isValid: boolean,
    isBakudan: boolean,
    // deno-lint-ignore no-explicit-any
    effect: any,
    // deno-lint-ignore no-explicit-any
    poisonDamage: any,
    errorMessage: string | null,
  ) {
    const playerIds = Array.from(this.clients.keys());
    const me1 = this.clients.get(playerIds[0])!.state;
    const me2 = this.clients.get(playerIds[1])!.state;

    this.clients.get(playerIds[0])!.socket.send(
      JSON.stringify(
        {
          type: "TURN_RESULT",
          payload: {
            turnId: this.turnId,
            word,
            isValid,
            isBakudan,
            effect,
            poisonDamage,
            myState: me1,
            opponentState: me2,
            errorMessage,
          },
        } satisfies ServerMessage,
      ),
    );
    this.clients.get(playerIds[1])!.socket.send(
      JSON.stringify(
        {
          type: "TURN_RESULT",
          payload: {
            turnId: this.turnId,
            word,
            isValid,
            isBakudan,
            effect,
            poisonDamage,
            myState: me2,
            opponentState: me1,
            errorMessage,
          },
        } satisfies ServerMessage,
      ),
    );
  }

  private endGame(
    winnerId: string,
    reason: "hp_zero" | "time_up" | "bakudan_failed" | "poison" | "disconnect",
  ) {
    if (this.timer) clearTimeout(this.timer);
    this.broadcast({ type: "GAME_OVER", payload: { winnerId, reason } });
    this.onRoomClose();
  }
}
