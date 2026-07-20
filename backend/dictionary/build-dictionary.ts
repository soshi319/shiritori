import { katakanaToHiragana } from "shared/logic/shiritoriValidator.ts"; // ※実際のパスに合わせてください

type JMdictKana = {
  text: string;
};

type JMdictSense = {
  misc?: string[];
};

type JMdictWord = {
  id: string;
  kana: JMdictKana[];
  sense: JMdictSense[];
};

const RARE_TAGS = new Set(["arch", "obs", "obsc", "rare"]);

function isObscureWord(word: JMdictWord): boolean {
  if (!word.sense || word.sense.length === 0) return false;

  return word.sense.every((sense) => {
    if (!sense.misc || sense.misc.length === 0) return false;
    return sense.misc.every((tag) => RARE_TAGS.has(tag));
  });
}

async function main() {
  // fetch() は一切使わず、ローカルのファイルパスを直接指定します
  const filePath = "./data/jmdict-eng.json";

  console.log(`ローカルファイル ${filePath} を読み込んでいます...`);
  const raw = await Deno.readTextFile(filePath);

  console.log("JSONデータをパースしています...");
  const parsedData = JSON.parse(raw);

  // JSONが [ {...}, {...} ] の配列形式か、{ words: [...] } の形式か両対応する
  const wordsArray: JMdictWord[] = Array.isArray(parsedData)
    ? parsedData
    : parsedData.words;

  if (!wordsArray) {
    throw new Error("辞書データの形式が想定と異なります。");
  }

  const set = new Set<string>();
  let excludedCount = 0;

  console.log("希少語を除外し、しりとり用単語を抽出しています...");

  for (const word of wordsArray) {
    if (isObscureWord(word)) {
      excludedCount++;
      continue;
    }

    for (const kana of word.kana) {
      const normalized = Array.from(kana.text).map(katakanaToHiragana).join("");
      set.add(normalized);
    }
  }

  const outputArray = Array.from(set);

  // アプリが読み込むための軽量なJSONを出力
  const outputPath = "./data/shiritori-words.json";
  await Deno.writeTextFile(outputPath, JSON.stringify(outputArray));

  console.log("\n==========================================");
  console.log(`✅ 軽量辞書の作成が完了しました！`);
  console.log(`・抽出されたしりとり用単語数 : ${outputArray.length} 件`);
  console.log(`・除外された希少語           : ${excludedCount} 件`);
  console.log(`・出力先                     : ${outputPath}`);
  console.log("==========================================\n");
}

main();
