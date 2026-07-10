export type SkillType = 'shortWordBoost' | 'counterReduction' | 'comboBoost' | 'poisonOnDakuten';

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