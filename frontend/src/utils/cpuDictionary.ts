// frontend/src/utils/cpuDictionary.ts (新規作成)

// 各文字ごとのCPUの語彙リスト（最後は必ず「ん」で終わる単語）
export const CPU_DICTIONARY: Record<string, string[]> = {
    "あ": ["あめ", "あさがお", "あき", "あかん"],
    "い": ["いか", "いす", "いと", "いおん"],
    "う": ["うみ", "うし", "うさぎ", "うどん"],
    "え": ["えき", "えんぴつ", "えのぐ", "えん"],
    "お": ["おにぎり", "おもちゃ", "おかし", "おんせん"],
    // ※必要に応じて、他の五十音も追加してください
    // デフォルトのフォールバック用（辞書にない文字で攻められた場合）
    "default": ["りんご", "ごま", "まり", "みかん"],
};

// ダメージ計算用（PracticeViewなどと共通のロジックがあればそれを使ってください）
export function calculateDamage(word: string): number {
    const length = word.length;
    if (length === 1) return 50;
    if (length === 2) return 30;
    if (length === 3) return 20;
    return 10;
}

// しりとりの最後の文字を取得する関数（小文字や伸ばし棒の処理）
export function getLastChar(word: string): string {
    let last = word.slice(-1);
    if (last === "ー" && word.length > 1) {
        last = word.slice(-2, -1);
    }
    const smallToLarge: Record<string, string> = {
        "ぁ": "あ",
        "ぃ": "い",
        "ぅ": "う",
        "ぇ": "え",
        "ぉ": "お",
        "ゃ": "や",
        "ゅ": "ゆ",
        "ょ": "よ",
        "っ": "つ",
    };
    return smallToLarge[last] || last;
}
