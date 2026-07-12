// --- 基本的なデータ型 ---

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

export type EffectData = {
  id: number;
  type: "hit" | "reflect";
  damage: number;
};

// --- クライアントからサーバーへ送るメッセージ (Client to Server) ---

export type JoinRoomMessage = {
  type: "JOIN_ROOM";
  payload: {
    playerName: string;
    characterId: string;
  };
};

export type SubmitWordMessage = {
  type: "SUBMIT_WORD";
  payload: {
    word: string;
  };
};

export type ClientMessage = JoinRoomMessage | SubmitWordMessage;

// --- サーバーからクライアントへ送るメッセージ (Server to Client) ---

export type MatchedMessage = {
  type: "MATCHED";
  payload: {
    roomId: string;
    me: PlayerState;
    opponent: PlayerState;
    initialWord: string;
    firstPlayerId: string;
  };
};

export type TurnStartMessage = {
  type: "TURN_START";
  payload: {
    turnId: number;
    activePlayerId: string;
    previousWord: string;
    duration: number;
  };
};

export type WaitOpponentMessage = {
  type: "WAIT_OPPONENT";
};

export type TurnResultMessage = {
  type: "TURN_RESULT";
  payload: {
    turnId: number;
    word: string;
    isValid: boolean;
    isBakudan: boolean;
    effect: EffectData | null;
    poisonDamage: {
      myDamage: number;
      opponentDamage: number;
    } | null;
    myState: PlayerState;
    opponentState: PlayerState;
    errorMessage: string | null;
  };
};

export type GameOverMessage = {
  type: "GAME_OVER";
  payload: {
    winnerId: string;
    reason: "hp_zero" | "time_up" | "bakudan_failed" | "poison" | "disconnect";
  };
};

export type ServerMessage =
  | MatchedMessage
  | TurnStartMessage
  | WaitOpponentMessage
  | TurnResultMessage
  | GameOverMessage;
