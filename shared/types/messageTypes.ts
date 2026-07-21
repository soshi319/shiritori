export type PlayerState = {
  id: string;
  name: string;
  characterId: string;
  hp: number;
  maxHp: number;
  hasEndured: boolean;
  poisonStacks: number;
  comboCount: number;
  lastWordLength: number | null;
};

// deno-lint-ignore no-explicit-any
export type EffectData = any; // 必要に応じて詳細な型を定義してください

export type RatingChange = {
  name: string;
  before: number;
  after: number;
  delta: number;
};

export type ClientMessage =
  | {
    type: "JOIN_ROOM";
    payload: {
      playerName: string;
      characterId: string;
      isCpuMode?: boolean; // ★ここに CPU戦フラグ（任意）を追加しました！
    };
  }
  | {
    type: "SUBMIT_WORD";
    payload: {
      word: string;
    };
  }
  | {
    type: "PING";
  };

export type ServerMessage =
  | {
    type: "PONG";
  }
  | {
    type: "MATCHED";
    payload: {
      roomId: string;
      me: PlayerState;
      opponent: PlayerState;
      initialWord: string;
      firstPlayerId: string;
    };
  }
  | {
    type: "TURN_START";
    payload: {
      turnId: number;
      activePlayerId: string;
      previousWord: string;
      duration: number;
    };
  }
  | {
    type: "WORD_REJECTED";
    payload: {
      word: string;
      message: string;
    };
  }
  | {
    type: "WAIT_OPPONENT";
  }
  | {
    type: "TURN_RESULT";
    payload: {
      turnId: number;
      word: string;
      isValid: boolean;
      isBakudan: boolean;
      effect: EffectData | null;
      poisonDamage: { myDamage: number; opponentDamage: number } | null;
      myState: PlayerState;
      opponentState: PlayerState;
      errorMessage: string | null;
    };
  }
  | {
    type: "GAME_OVER";
    payload: {
      winnerId: string;
      reason:
        | "hp_zero"
        | "time_up"
        | "bakudan_failed"
        | "poison"
        | "disconnect";
      // ★CPU対戦・レート未設定時はundefined（レート対象外）
      ratings?: {
        winner: RatingChange;
        loser: RatingChange;
      };
    };
  };
