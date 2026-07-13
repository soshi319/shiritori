import { katakanaToHiragana } from "shared/logic/shiritoriValidator.ts";

type JMdictKana = {
  text: string;
};

type JMdictWord = {
  kana: JMdictKana[];
};

type JMdictFile = {
  words: JMdictWord[];
};

let cachedDictionary: Set<string> | null = null;

/**
 * JMdict（common版）を読み込み、読み仮名（ひらがな統一）のSetを構築する。
 * 一度読み込んだ結果はメモリ上にキャッシュされ、以後は再利用される。
 */
export async function loadDictionary(): Promise<Set<string>> {
  if (cachedDictionary) return cachedDictionary;

  console.log("辞書を読み込んでいます...");

  const filePath = new URL(
    "../data/jmdict-eng-common-3.6.2.json",
    import.meta.url,
  );
  const raw = await Deno.readTextFile(filePath);
  const data = JSON.parse(raw) as JMdictFile;

  const set = new Set<string>();
  for (const word of data.words) {
    for (const kana of word.kana) {
      const normalized = Array.from(kana.text).map(katakanaToHiragana).join("");
      set.add(normalized);
    }
  }

  cachedDictionary = set;
  console.log(`辞書を読み込みました（${set.size}件）`);
  return set;
}
