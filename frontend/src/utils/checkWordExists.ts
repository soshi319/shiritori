import { CHECK_WORD_API_URL } from "shared/config/serverConfig";

export async function checkWordExists(word: string): Promise<boolean> {
    try {
        const response = await fetch(
            `${CHECK_WORD_API_URL}?word=${encodeURIComponent(word)}`,
        );
        const data = await response.json();
        return data.exists as boolean;
    } catch (error) {
        console.error("辞書チェックに失敗しました:", error);
        return true; // フェイルオープン：通信エラー時は通す
    }
}
