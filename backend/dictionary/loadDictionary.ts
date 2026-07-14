import { katakanaToHiragana } from "shared/logic/shiritoriValidator.ts";

type JMdictKana = {
  text: string;
};

type JMdictSense = {
  misc: string[]; // 例: ["arch"], ["obs"], [] など
};

type JMdictWord = {
  kana: JMdictKana[];
  sense: JMdictSense[];
};

type JMdictFile = {
  words: JMdictWord[];
};

let cachedDictionary: Set<string> | null = null;

// 古語・廃語・希少語を示すタグ
const RARE_TAGS = new Set(["arch", "obs", "obsc", "rare"]);

/**
 * その単語の「すべての意味」が、古語・廃語・希少語タグのみで構成されているかを判定する。
 * 1つでも通常の意味（タグ無し、または上記以外のタグ）があれば false（＝除外しない）を返す。
 */
function isObscureWord(word: JMdictWord): boolean {
  if (word.sense.length === 0) return false;

  return word.sense.every((sense) => {
    if (sense.misc.length === 0) return false; // タグが無い意味がある = 普通に使われる
    return sense.misc.every((tag) => RARE_TAGS.has(tag));
  });
}

export async function loadDictionary(): Promise<Set<string>> {
  if (cachedDictionary) return cachedDictionary;

  console.log("辞書を読み込んでいます...");

  const filePath = new URL("../data/jmdict-eng.json", import.meta.url);
  const raw = await Deno.readTextFile(filePath);
  const data = JSON.parse(raw) as JMdictFile;

  const set = new Set<string>();
  let excludedCount = 0;

  for (const word of data.words) {
    if (isObscureWord(word)) {
      excludedCount++;
      continue; // 古語・廃語・希少語のみの単語は辞書に含めない
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
