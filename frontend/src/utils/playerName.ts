const STORAGE_KEY = "shiritori:playerName";
const DEFAULT_NAME = "プレイヤー";

/**
 * 保存されているプレイヤー名を取得する。
 * 未設定の場合はデフォルト名を返す（保存はしない＝入力欄には空で表示したい場合はこの関数を使わず、
 * 直接 localStorage.getItem を見てもよい）。
 */
export function getPlayerName(): string {
    if (typeof window === "undefined") return DEFAULT_NAME;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && saved.trim().length > 0 ? saved : DEFAULT_NAME;
}

/**
 * プレイヤー名を保存する。前後の空白は取り除き、空文字ならデフォルト名を保存する。
 */
export function savePlayerName(name: string): string {
    const trimmed = name.trim();
    const finalName = trimmed.length > 0 ? trimmed : DEFAULT_NAME;
    if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, finalName);
    }
    return finalName;
}

export { DEFAULT_NAME };
