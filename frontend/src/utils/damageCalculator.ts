import type { Character } from '../types/character';

/**
 * 基本ダメージを計算する
 * ダメージ = 攻撃力 × 減衰率^(文字数 - 1)
 *
 * 文字数は入力された単語の文字列長をそのまま使う
 * （拗音・長音符も1文字としてカウントする方針のため .length で十分）
 */
export function calculateBaseDamage(character: Character, word: string): number {
  const wordLength = word.length;
  const decayExponent = wordLength - 1;
  const damage = character.basePower * Math.pow(character.decayRate, decayExponent);

  return Math.ceil(damage);
}