import type {
  ClientMessage,
  PlayerState,
  ServerMessage,
} from "shared/types/messageTypes.ts";
import { characters } from "shared/data/characters.ts";
import {
  getRequiredNextStart,
  isKnownWord,
  normalizeWordForComparison,
  validateWord,
} from "shared/logic/shiritoriValidator.ts";
import { resolveTurn } from "../game/turnResolver.ts";
import { GAME_CONFIG } from "shared/config/gameConfig.ts";
import { CPU_DICTIONARY } from "shared/data/cpuDictionary.ts";

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

  private isCpuMode = false;
  private cpuId: string | null = null;
  private cpuTimer: ReturnType<typeof setTimeout> | null = null;

  // ★音（ひらがな1文字）ごとに、CPU_DICTIONARYの配列を何番目まで使ったかを覚えておく
  private cpuMoraIndex: Map<string, number> = new Map();

  constructor(
    public roomId: string,
    p1: { socket: WebSocket; name: string; characterId: string },
    p2: { socket: WebSocket; name: string; characterId: string },
    private dictionary: Set<string>,
    private onRoomClose: () => void,
    isCpuMode = false,
  ) {
    this.isCpuMode = isCpuMode;
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();

    this.addClient(id1, p1);
    this.addClient(id2, p2);

    if (this.isCpuMode) {
      this.cpuId = id2; // 2人目のプレイヤーをCPUとして指定
    }

    for (const [id, client] of this.clients.entries()) {
      // CPUプレイヤーの場合は実体のソケットがないため、イベント登録をスキップ
      if (this.isCpuMode && id === this.cpuId) continue;

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

  private sendToClient(id: string, message: ServerMessage) {
    const client = this.clients.get(id);
    if (
      client && client.socket && client.socket.readyState === WebSocket.OPEN
    ) {
      client.socket.send(JSON.stringify(message));
    }
  }

  private broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.socket && client.socket.readyState === WebSocket.OPEN) {
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

    this.sendToClient(playerIds[0], {
      type: "MATCHED",
      payload: {
        roomId: this.roomId,
        me: me1,
        opponent: me2,
        initialWord: this.currentWord,
        firstPlayerId: this.activePlayerId,
      },
    });

    this.sendToClient(playerIds[1], {
      type: "MATCHED",
      payload: {
        roomId: this.roomId,
        me: me2,
        opponent: me1,
        initialWord: this.currentWord,
        firstPlayerId: this.activePlayerId,
      },
    });

    this.startTurn();
  }

  private startTurn() {
    this.turnId++;
    this.activeWord = null;
    this.predictedWord = null;

    if (this.cpuTimer) clearTimeout(this.cpuTimer);

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

    if (this.isCpuMode && this.activePlayerId === this.cpuId) {
      this.handleCpuAttack();
    }
  }

  /**
   * ★CPUの攻撃（思考）ロジック。
   * 辞書全体からランダムに探すのではなく、CPU_DICTIONARYの中から
   * 「その音で何番目まで使ったか」を覚えておいて順番に返す。
   * 同じ音で連続して攻められると配列を使い切り、最終的には「ん」で終わる単語
   * （＝配列の最後）を口走ることになる。その単語が必殺技の条件を満たさなければ、
   * 既存の validateWord の nounEnding 判定によってCPUがそのまま自滅する。
   */
  private handleCpuAttack() {
    const requiredStart = getRequiredNextStart(this.currentWord);
    const chosenWord = this.pickCpuWord(requiredStart);

    const thinkDelay = 1500 + Math.random() * 1500;

    this.cpuTimer = setTimeout(() => {
      if (!chosenWord) {
        // その音の持ち駒が尽きた場合は、これまで通りタイムアップ（パス）扱いにフォールバック
        this.handleTimeUp();
        return;
      }

      this.activeWord = chosenWord;

      if (this.predictedWord !== null) {
        this.resolveCurrentTurn();
      }
    }, thinkDelay);
  }

  /**
   * requiredStart（次に必要な音）に対して、CPU_DICTIONARYから未使用の単語を1つ選ぶ。
   * 既に場に出ている単語はスキップする。配列を使い切っていれば null を返す。
   */
  private pickCpuWord(requiredStart: string): string | null {
    const candidates = CPU_DICTIONARY[requiredStart];
    if (!candidates || candidates.length === 0) return null;

    let idx = this.cpuMoraIndex.get(requiredStart) ?? 0;

    while (idx < candidates.length && this.usedWords.has(candidates[idx])) {
      idx++;
    }

    if (idx >= candidates.length) return null;

    this.cpuMoraIndex.set(requiredStart, idx + 1);
    return candidates[idx];
  }

  private handleMessage(senderId: string, data: string) {
    const message = JSON.parse(data) as ClientMessage;
    if (message.type !== "SUBMIT_WORD") return;

    const word = message.payload.word;

    if (senderId === this.activePlayerId) {
      const hasDictionary = this.dictionary.size > 0;

      if (hasDictionary && !isKnownWord(word, this.dictionary)) {
        this.sendToClient(senderId, {
          type: "WORD_REJECTED",
          payload: {
            word,
            message:
              `「${word}」は辞書に見つかりませんでした。別の単語を入力してください。`,
          },
        });
        return;
      }

      this.activeWord = word;

      if (this.isCpuMode) {
        this.predictedWord = "CPU_NO_COUNTER_PREDICTION";
        this.resolveCurrentTurn();
        return;
      }
    } else {
      this.predictedWord = word;
    }

    this.sendToClient(senderId, { type: "WAIT_OPPONENT" });

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
    if (this.cpuTimer) clearTimeout(this.cpuTimer);

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
    if (this.cpuTimer) clearTimeout(this.cpuTimer);

    if (this.isCpuMode && disconnectedId === this.cpuId) return;

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

    this.sendToClient(playerIds[0], {
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
    });

    this.sendToClient(playerIds[1], {
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
    });
  }

  private endGame(
    winnerId: string,
    reason: "hp_zero" | "time_up" | "bakudan_failed" | "poison" | "disconnect",
  ) {
    if (this.timer) clearTimeout(this.timer);
    if (this.cpuTimer) clearTimeout(this.cpuTimer);
    this.broadcast({ type: "GAME_OVER", payload: { winnerId, reason } });
    this.onRoomClose();
  }
}
