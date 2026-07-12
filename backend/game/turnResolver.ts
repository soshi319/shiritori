import type {
  EffectData,
  PlayerState,
} from "../../shared/types/messageTypes.ts";
import { characters } from "shared/data/characters.ts";
import { calculateBaseDamage } from "shared/logic/damageCalculator.ts";

const POISON_DAMAGE_PER_STACK = 5;
const COMBO_DAMAGE_BONUS_RATE = 0.2;

export type ResolveTurnResult = {
  isValid: boolean;
  isBakudan: boolean;
  effect: EffectData | null;
  poisonDamage: { myDamage: number; opponentDamage: number } | null;
  nextMyState: PlayerState;
  nextOpponentState: PlayerState;
  gameOverReason: "hp_zero" | "poison" | null;
  enduredPlayerId: string | null;
};

export function resolveTurn(
  word: string,
  isBakudan: boolean,
  isReflected: boolean,
  currentMyState: PlayerState,
  currentOpponentState: PlayerState,
): ResolveTurnResult {
  const nextMyState = { ...currentMyState };
  const nextOpponentState = { ...currentOpponentState };

  let mainDamage = 0;
  let effect: EffectData | null = null;
  let enduredPlayerId: string | null = null;

  const targetState = isReflected ? nextMyState : nextOpponentState;
  const attackerState = isReflected ? nextOpponentState : nextMyState;

  if (isBakudan) {
    mainDamage = 999;
  } else {
    const attackerChar = characters.find((c) =>
      c.id === attackerState.characterId
    )!;
    mainDamage = calculateBaseDamage(attackerChar, word);

    // バルドの反射半減スキル
    if (isReflected && targetState.characterId === "B") {
      mainDamage = Math.ceil(mainDamage / 2);
    }

    // 【追加】チェスターのコンボボーナス
    if (attackerChar.skillType === "comboBoost") {
      const isSameLengthAsBefore = attackerState.lastWordLength === word.length;
      const newComboCount = isSameLengthAsBefore
        ? attackerState.comboCount + 1
        : 0;

      const multiplier = 1 + newComboCount * COMBO_DAMAGE_BONUS_RATE;
      mainDamage = Math.ceil(mainDamage * multiplier);

      attackerState.comboCount = newComboCount;
      attackerState.lastWordLength = word.length;
    }
  }

  if (mainDamage > 0) {
    targetState.hp -= mainDamage;
    effect = {
      id: Date.now(),
      type: isReflected ? "reflect" : "hit",
      damage: mainDamage,
    };
  }

  // アレスの食いしばり判定
  if (
    nextMyState.characterId === "A" && nextMyState.hp <= 0 &&
    !nextMyState.hasEndured
  ) {
    nextMyState.hp = 1;
    nextMyState.hasEndured = true;
    enduredPlayerId = nextMyState.id;
  }
  if (
    nextOpponentState.characterId === "A" && nextOpponentState.hp <= 0 &&
    !nextOpponentState.hasEndured
  ) {
    nextOpponentState.hp = 1;
    nextOpponentState.hasEndured = true;
    enduredPlayerId = nextOpponentState.id;
  }

  const isGameOverAfterMain = nextMyState.hp <= 0 || nextOpponentState.hp <= 0;

  let myPoisonDmg = 0;
  let opponentPoisonDmg = 0;

  if (!isGameOverAfterMain) {
    if (nextMyState.poisonStacks > 0) {
      myPoisonDmg = POISON_DAMAGE_PER_STACK * nextMyState.poisonStacks;
      nextMyState.hp -= myPoisonDmg;
    }
    if (nextOpponentState.poisonStacks > 0) {
      opponentPoisonDmg = POISON_DAMAGE_PER_STACK *
        nextOpponentState.poisonStacks;
      nextOpponentState.hp -= opponentPoisonDmg;
    }
  }

  const poisonDamage = (myPoisonDmg > 0 || opponentPoisonDmg > 0)
    ? { myDamage: myPoisonDmg, opponentDamage: opponentPoisonDmg }
    : null;

  let gameOverReason: "hp_zero" | "poison" | null = null;

  if (nextMyState.hp <= 0 || nextOpponentState.hp <= 0) {
    gameOverReason = isGameOverAfterMain ? "hp_zero" : "poison";

    if (nextMyState.hp < 0) nextMyState.hp = 0;
    if (nextOpponentState.hp < 0) nextOpponentState.hp = 0;
  }

  return {
    isValid: true,
    isBakudan,
    effect,
    poisonDamage,
    nextMyState,
    nextOpponentState,
    gameOverReason,
    enduredPlayerId,
  };
}
