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

// 【追加】辞書ファイルの配布元URL（jmdict-simplifiedのリリースページから確認したURLに差し替えてください）
const DICTIONARY_URL =
  "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.1+20250203122839/jmdict-eng-3.6.1+20250203122839.json";

function isObscureWord(word: JMdictWord): boolean {
  if (word.sense.length === 0) return false;

  return word.sense.every((sense) => {
    if (sense.misc.length === 0) return false;
    return sense.misc.every((tag) => RARE_TAGS.has(tag));
  });
}

// 【追加】ファイルが存在しなければ、ダウンロードしてくる
async function ensureDictionaryFile(filePath: URL): Promise<void> {
  try {
    await Deno.stat(filePath);
    console.log("辞書ファイルは既に存在します。ダウンロードをスキップします。");
    return;
  } catch {
    console.log("辞書ファイルが見つからないため、ダウンロードします...");
  }

  const response = await fetch(DICTIONARY_URL);
  if (!response.ok) {
    throw new Error(`辞書のダウンロードに失敗しました: ${response.status}`);
  }

  const data = await response.text();
  await Deno.writeTextFile(filePath, data);
  console.log("辞書ファイルのダウンロードが完了しました。");
}

export async function loadDictionary(): Promise<Set<string>> {
  if (cachedDictionary) return cachedDictionary;

  const filePath = new URL("../data/jmdict-eng-common.json", import.meta.url);

  await ensureDictionaryFile(filePath);

  console.log("辞書を読み込んでいます...");
  const raw = await Deno.readTextFile(filePath);
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
