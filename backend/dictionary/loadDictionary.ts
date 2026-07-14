import { katakanaToHiragana } from "shared/logic/shiritoriValidator.ts";

type JMdictKana = {
  text: string;
};

type JMdictSense = {
  misc: string[];
};

type JMdictWord = {
  kana: JMdictKana[];
  sense: JMdictSense[];
};

type JMdictFile = {
  words: JMdictWord[];
};

let cachedDictionary: Set<string> | null = null;

const RARE_TAGS = new Set(["arch", "obs", "obsc", "rare"]);

const DICTIONARY_URL =
  "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.1+20250203122839/jmdict-eng-3.6.1+20250203122839.json";

function isObscureWord(word: JMdictWord): boolean {
  if (word.sense.length === 0) return false;

  return word.sense.every((sense) => {
    if (sense.misc.length === 0) return false;
    return sense.misc.every((tag) => RARE_TAGS.has(tag));
  });
}

// 【修正】Deno Deployに対応するため、ファイルの書き込み処理（ensureDictionaryFile）を削除し、
// 直接メモリ上で処理するように変更しました。
export async function loadDictionary(): Promise<Set<string>> {
  if (cachedDictionary) return cachedDictionary;

  const filePath = new URL("../data/jmdict-eng-common.json", import.meta.url);
  let raw: string;

  try {
    // 1. まずローカルの静的アセット（同梱されている場合）として読み込みを試みる
    console.log("ローカルから辞書ファイルの読み込みを試みています...");
    raw = await Deno.readTextFile(filePath);
  } catch {
    // 2. Deno Deploy環境などファイルがない場合は、URLから直接メモリ上にダウンロードする
    console.log("辞書ファイルがローカルにないため、URLから直接取得します...");
    const response = await fetch(DICTIONARY_URL);
    if (!response.ok) {
      throw new Error(`辞書のダウンロードに失敗しました: ${response.status}`);
    }
    raw = await response.text();
    // ★ Deno Deployは書き込み不可のため、Deno.writeTextFile は行わずメモリのまま処理します
  }

  console.log("辞書データを解析しています...");
  const data = JSON.parse(raw) as JMdictFile;

  const set = new Set<string>();
  let excludedCount = 0;

  for (const word of data.words) {
    if (isObscureWord(word)) {
      excludedCount++;
      continue;
    }

    for (const kana of word.kana) {
      const normalized = Array.from(kana.text).map(katakanaToHiragana).join("");
      set.add(normalized);
    }
  }

  cachedDictionary = set;
  console.log(
    `辞書を読み込みました（${set.size}件、古語・希少語など${excludedCount}件を除外）`,
  );
  return set;
}
