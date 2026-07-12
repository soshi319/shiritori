// backend/game/damageCalculator.ts
import type { Character } from "../data/characters.ts";

/**
 * 基本ダメージを計算する
 * ダメージ = 攻撃力 × 減衰率^(文字数 - 1)
 */
export function calculateBaseDamage(
  character: Character,
  word: string,
): number {
  const wordLength = word.length;
  // 万が一文字数が0の場合にマイナス乗にならないよう安全対策
  const decayExponent = Math.max(0, wordLength - 1);

  const damage = character.basePower *
    Math.pow(character.decayRate, decayExponent);

  // 小数点は切り上げて最低ダメージを保証
  return Math.ceil(damage);
}
