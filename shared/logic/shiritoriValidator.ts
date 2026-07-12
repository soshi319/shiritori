const DAKUTEN_REGEX =
  /[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴ]/;

export type ValidationResult = {
  isValid: boolean;
  errorMessage: string | null;
  isBakudan: boolean;
  triggersPoison: boolean;
};

// カタカナをひらがなに変換する
export function katakanaToHiragana(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCharCode(code - 0x60);
  }
  return char;
}

// 単語全体をひらがなに統一する（比較用）
export function normalizeWordForComparison(word: string): string {
  return Array.from(word).map(katakanaToHiragana).join("");
}

const YOUON_SET = new Set(["ゃ", "ゅ", "ょ"]);
const DAKU_CONVERT: Record<string, string> = { "ぢ": "じ", "づ": "ず" };
const SMALL_TO_BIG: Record<string, string> = {
  "ぁ": "あ",
  "ぃ": "い",
  "ぅ": "う",
  "ぇ": "え",
  "ぉ": "お",
  "っ": "つ",
};

/**
 * 公式ルール（第4条）に基づき、「次の単語が始まるべき文字列」を返す
 * ・拗音（しゃ等）で終わる場合 → その2文字をそのまま返す（例:「しゃ」）
 * ・長音「ー」で終わる場合 → 直前の文字を見る
 * ・「ぢ」「づ」で終わる場合 → 「じ」「ず」に変換
 * ・それ以外 → 末尾の1文字（濁点はそのまま維持する）
 */
export function getRequiredNextStart(word: string): string {
  const hiraWord = normalizeWordForComparison(word);
  if (hiraWord.length === 0) return "";

  let target = hiraWord;
  let lastChar = target.slice(-1);

  // 長音「ー」→ 直前の文字を見る
  if (lastChar === "ー" && target.length > 1) {
    target = target.slice(0, -1);
    lastChar = target.slice(-1);
  }

  // 拗音（ゃゅょ）→ 直前の文字と合わせた2文字をそのまま使う
  if (YOUON_SET.has(lastChar) && target.length > 1) {
    return target.slice(-2);
  }

  // 「ぢ」「づ」→「じ」「ず」に変換
  if (DAKU_CONVERT[lastChar]) {
    return DAKU_CONVERT[lastChar];
  }

  // 小さい「っ」「ぁぃぅぇぉ」→ 対応する大きい文字に変換（公式ルールに明記はないが慣例として維持）
  if (SMALL_TO_BIG[lastChar]) {
    return SMALL_TO_BIG[lastChar];
  }

  return lastChar;
}

export function validateWord(
  word: string,
  previousWord: string,
  usedWords: Set<string>,
  playerHp: number,
  characterId: string,
): ValidationResult {
  if (usedWords.has(word)) {
    return {
      isValid: false,
      errorMessage: `「${word}」は既に使用されています`,
      isBakudan: false,
      triggersPoison: false,
    };
  }

  if (previousWord) {
    const requiredStart = getRequiredNextStart(previousWord);
    const hiraWord = normalizeWordForComparison(word);

    if (!hiraWord.startsWith(requiredStart)) {
      return {
        isValid: false,
        errorMessage: `「${requiredStart}」から始まっていません`,
        isBakudan: false,
        triggersPoison: false,
      };
    }
  }

  let isBakudan = false;
  if (word.endsWith("ん") || word.endsWith("ン")) {
    if (word.length === 4 && playerHp <= 30) {
      isBakudan = true;
    } else {
      return {
        isValid: false,
        errorMessage: "「ん」がつきました（即死）",
        isBakudan: false,
        triggersPoison: false,
      };
    }
  }

  let triggersPoison = false;
  if (characterId === "D" && DAKUTEN_REGEX.test(word)) {
    triggersPoison = true;
  }

  return {
    isValid: true,
    errorMessage: null,
    isBakudan,
    triggersPoison,
  };
}
