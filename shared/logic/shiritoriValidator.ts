const DAKUTEN_REGEX =
  /[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴ]/;

export type FailureReason = "usedWord" | "notConnected" | "nounEnding" | null;

export type ValidationResult = {
  isValid: boolean;
  errorMessage: string | null;
  isBakudan: boolean;
  triggersPoison: boolean;
  failureReason: FailureReason;
};

export function katakanaToHiragana(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCharCode(code - 0x60);
  }
  return char;
}

export function normalizeWordForComparison(word: string): string {
  return Array.from(word).map(katakanaToHiragana).join("");
}

// 【追加】辞書に実在する単語かどうかだけを調べる、単体の関数
export function isKnownWord(word: string, dictionary: Set<string>): boolean {
  return dictionary.has(normalizeWordForComparison(word));
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

export function getRequiredNextStart(word: string): string {
  const hiraWord = normalizeWordForComparison(word);
  if (hiraWord.length === 0) return "";

  let target = hiraWord;
  let lastChar = target.slice(-1);

  if (lastChar === "ー" && target.length > 1) {
    target = target.slice(0, -1);
    lastChar = target.slice(-1);
  }

  if (YOUON_SET.has(lastChar) && target.length > 1) {
    return target.slice(-2);
  }

  if (DAKU_CONVERT[lastChar]) {
    return DAKU_CONVERT[lastChar];
  }

  if (SMALL_TO_BIG[lastChar]) {
    return SMALL_TO_BIG[lastChar];
  }

  return lastChar;
}

// 【変更】dictionary関連の引数・処理を削除（役目を終えたため）
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
      failureReason: "usedWord",
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
        failureReason: "notConnected",
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
        failureReason: "nounEnding",
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
    failureReason: null,
  };
}
