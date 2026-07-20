let cachedDictionary: Set<string> | null = null;

export async function loadDictionary(): Promise<Set<string>> {
  // すでにメモリに読み込まれていれば、それを返す（高速化）
  if (cachedDictionary) return cachedDictionary;

  // 事前に生成した軽量な配列データ（shiritori-words.json）のパスを指定
  const filePath = new URL("../data/shiritori-words.json", import.meta.url);

  try {
    console.log("軽量辞書データを読み込んでいます...");
    const raw = await Deno.readTextFile(filePath);

    // JSONを単なる文字列の配列としてパースする
    const wordsArray = JSON.parse(raw) as string[];

    // 配列をSet（重複のない集合）に変換してキャッシュする
    cachedDictionary = new Set(wordsArray);

    console.log(`辞書を読み込みました（${cachedDictionary.size}件）`);
    return cachedDictionary;
  } catch (error) {
    console.error("辞書ファイルの読み込みに失敗しました:", error);
    throw error;
  }
}
