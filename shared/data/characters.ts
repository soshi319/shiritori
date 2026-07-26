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
    flavorText: "短い言葉で一撃必殺の特大ダメージを狙うロマン砲。",
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
    flavorText: "相手の反射リスクを抑え、安定した立ち回りができる鉄壁の盾。",
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
    flavorText: "文字数に囚われず手数を繰り出すトリッキーファイター。",
    imageUrl: "/images/C.png",
    themeColor: "#F2DF23", // チェスター (黄)
    textColor: "#1C1917", // 黒文字
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
    flavorText: "濁点・半濁点を巧みに操り相手を苦しめる頭脳派キャラ。",
    imageUrl: "/images/D.png",
    themeColor: "#997FC8", // ドロシー (紫)
    textColor: "#FFFFFF",
  },
];
