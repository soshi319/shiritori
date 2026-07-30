import type {
    EffectData,
    PlayerState,
} from "../../shared/types/messageTypes.ts";
import { characters } from "shared/data/characters.ts";
import { calculateBaseDamage } from "shared/logic/damageCalculator.ts";

const POISON_DAMAGE_PER_STACK = 5;
const COMBO_DAMAGE_BONUS_RATE = 0.2;
// ★一閃・必殺技（バクダン）の固定ダメージ。
//   以前は999で「発動＝確定即死」だったが、キャラのmaxHp（90〜150）を
//   完全に無視してしまい、特にバルド(HP150)のタンクとしての存在意義を
//   薄めてしまっていたため、以下のように緩和する。
//   ・HPがこの値以下まで削られている相手には引き続きほぼ確定キルの迫力を保てる
//   ・フルHPの相手には即死にならない（バルドはフルHPから受けても90残る）
//   ・発動者自身はHP30以下の時にしか撃てないため、反射された場合は
//     このダメージで確実に自滅する（返り討ちのリスクは変わらず機能する）
export const BAKUDAN_DAMAGE = 60;

export type ResolveTurnResult = {
    isValid: boolean;
    isBakudan: boolean;
    effect: EffectData | null;
    poisonDamage: { myDamage: number; opponentDamage: number } | null;
    nextMyState: PlayerState;
    nextOpponentState: PlayerState;
    gameOverReason: "hp_zero" | "poison" | "bakudan_failed" | null;
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
        mainDamage = BAKUDAN_DAMAGE;
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
            const isSameLengthAsBefore =
                attackerState.lastWordLength === word.length;
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

    // ★一閃・必殺技（ん終わりの単語）を発動しても相手を倒しきれなかった場合、
    //   その単語自体が「ん」で終わっているため、決着しないまま次のプレイヤーに
    //   手番を渡すと「『ん』から始まる言葉」を要求される詰み状態になってしまう。
    //   これを防ぐため、決めきれなかった一閃は発動した本人の反則負け（自滅）とする。
    //   （条件を満たさず「ん」を出した時の自爆と同じ扱い。食いしばりの対象外）
    let bakudanBackfired = false;
    if (isBakudan && targetState.hp > 0) {
        bakudanBackfired = true;
        nextMyState.hp = 0;
    }

    // アレスの食いしばり判定（一閃の不発による自滅は対象外）
    if (!bakudanBackfired) {
        if (
            nextMyState.characterId === "A" && nextMyState.hp <= 0 &&
            !nextMyState.hasEndured
        ) {
            nextMyState.hp = 1;
            nextMyState.hasEndured = true;
            enduredPlayerId = nextMyState.id;
        }
        if (
            nextOpponentState.characterId === "A" &&
            nextOpponentState.hp <= 0 &&
            !nextOpponentState.hasEndured
        ) {
            nextOpponentState.hp = 1;
            nextOpponentState.hasEndured = true;
            enduredPlayerId = nextOpponentState.id;
        }
    }

    const isGameOverAfterMain = nextMyState.hp <= 0 ||
        nextOpponentState.hp <= 0;

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

    let gameOverReason: "hp_zero" | "poison" | "bakudan_failed" | null = null;

    if (bakudanBackfired) {
        gameOverReason = "bakudan_failed";
    } else if (nextMyState.hp <= 0 || nextOpponentState.hp <= 0) {
        gameOverReason = isGameOverAfterMain ? "hp_zero" : "poison";
    }

    if (nextMyState.hp < 0) nextMyState.hp = 0;
    if (nextOpponentState.hp < 0) nextOpponentState.hp = 0;

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
