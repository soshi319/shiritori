// frontend/src/shared/data/characters.ts (または共通の配置場所)

export type SkillType =
  | "shortWordBoost"
  | "counterReduction"
  | "comboBoost"
  | "poisonOnDakuten";

export type Character = {
  id: string;
  name: string;
  job: string;
  role: string;
  maxHp: number;
  basePower: number;
  decayRate: number;
  skillName: string;
  skillDescription: string;
  skillType: SkillType;
  flavorText: string;
  imageUrl: string;
  // 追加：キャラクター固有のテーマカラー設定
  themeColor: string;
  textColor: string;
};

export const characters: Character[] = [
  {
    id: "A",
    name: "アレス",
    job: "剣士",
    role: "Attacker",
    maxHp: 120,
    basePower: 35,
    decayRate: 0.55,
    skillName: "根性",
    skillDescription:
      "短い単語ほど桁違いの威力になるが、長い単語では威力が大きく落ちる。HP1で1回だけ耐える。",
    skillType: "shortWordBoost",
    flavorText:
      "剣を振るう。「短い文字が高火力」というゲームのコアシステムを最も体現する、特大ダメージ狙いのロマン砲。",
    imageUrl: "/images/A.png",
    themeColor: "#DF362F", // アレス (赤)
    textColor: "#FFFFFF",
  },
  {
    id: "B",
    name: "バルド",
    job: "重騎士",
    role: "Blocker",
    maxHp: 150,
    basePower: 25,
    decayRate: 0.80,
    skillName: "鉄壁の盾",
    skillDescription:
      "相手からのカウンター（反射）ダメージを常に半減する。長い単語でも安定した火力を出せる。",
    skillType: "counterReduction",
    flavorText:
      "巨大な盾で攻撃をいなす鉄壁の守り。心理戦の手痛いカウンターのリスクを軽減し、最も安定した立ち回りができる。",
    imageUrl: "/images/B.png",
    themeColor: "#6C92C1", // バルド (青)
    textColor: "#FFFFFF",
  },
  {
    id: "C",
    name: "チェスター",
    job: "遊び人",
    role: "Combo",
    maxHp: 100,
    basePower: 20,
    decayRate: 0.90,
    skillName: "連続攻撃",
    skillDescription:
      "前の単語の文字数に関係なく、常に一定のダメージを与える。コンボが繋がりやすい。",
    skillType: "comboBoost",
    flavorText:
      "軽快なステップで連続攻撃を叩き込む。手数で勝負するトリッキーな戦法が得意。",
    imageUrl: "/images/C.png",
    themeColor: "#F2DF23", // チェスター (黄)
    textColor: "#1C1917", // 可読性のための黒文字
  },
  {
    id: "D",
    name: "ドロシー",
    job: "錬金術師",
    role: "Debuffer",
    maxHp: 90,
    basePower: 15,
    decayRate: 0.95,
    skillName: "猛毒薬",
    skillDescription:
      "濁点・半濁点が含まれる単語を使うと、相手を毒状態にする。",
    skillType: "poisonOnDakuten",
    flavorText:
      "怪しげな液体の入ったフラスコを持ち歩き、ニヤニヤしている。濁点・半濁点を探すパズル的な思考が求められるテクニカルキャラ。",
    imageUrl: "/images/D.png",
    themeColor: "#997FC8", // ドロシー (紫)
    textColor: "#FFFFFF",
  },
];
