// backend/game/characters.ts

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
};

// フロントエンドの data/characters.ts と全く同じデータを定義します
export const characters: Character[] = [
  {
    id: "A",
    name: "アレス",
    job: "剣士",
    role: "Attacker",
    maxHp: 120,
    basePower: 35,
    decayRate: 0.55,
    skillName: "ロマン砲",
    skillDescription:
      "短い単語ほど桁違いの威力になるが、長い単語では威力が大きく落ちる。HP1で1回だけ耐える。",
    skillType: "shortWordBoost",
    flavorText:
      "剣を振るう。「短い文字が高火力」というゲームのコアシステムを最も体現する、特大ダメージ狙いのロマン砲。",
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
  },
  {
    id: "C",
    name: "チェスター",
    job: "遊び人",
    role: "Combo",
    maxHp: 100,
    basePower: 28,
    decayRate: 0.75,
    skillName: "コンボチェイン",
    skillDescription:
      "同じ文字数の単語を重ねるごとに、与えるダメージが段階的に上昇していく。",
    skillType: "comboBoost",
    flavorText:
      "リズムに乗って言葉を紡ぐほど本領を発揮する、テンポ重視のコンボアタッカー。",
  },
  {
    id: "D",
    name: "ドロシー",
    job: "悪の科学者",
    role: "Debuffer",
    maxHp: 90,
    basePower: 24,
    decayRate: 0.78,
    skillName: "猛毒配合",
    skillDescription:
      "濁点・半濁点を含む言葉を使うと、相手に「毒」を付与し継続ダメージを与える。",
    skillType: "poisonOnDakuten",
    flavorText:
      "濁点・半濁点を含む言葉を探す、パズル的思考が求められるテクニカルなキャラクター。",
  },
];
