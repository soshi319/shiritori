import type { Character } from 'shared/data/characters';

type CharacterSkillPopoverProps = {
  character: Character;
  align: 'left' | 'right';
  onClose: () => void;
};

/**
 * 対戦中にキャラクターをタップ/クリックした時に出す、固有スキル説明のポップオーバー。
 * GameView.tsx / CpuView.tsx の両方から使う想定。
 *
 * 使い方の例（キャラクター画像側）:
 *   const [openSkillFor, setOpenSkillFor] = useState<'me' | 'opponent' | null>(null);
 *   ...
 *   <button onClick={() => setOpenSkillFor((prev) => (prev === 'me' ? null : 'me'))}>
 *     <img src={...} />
 *   </button>
 *   {openSkillFor === 'me' && (
 *     <CharacterSkillPopover
 *       character={myCharacter}
 *       align="left"
 *       onClose={() => setOpenSkillFor(null)}
 *     />
 *   )}
 */
export function CharacterSkillPopover({ character, align, onClose }: CharacterSkillPopoverProps) {
  return (
    <>
      {/* 背景をタップ/クリックしたら閉じる、透明なオーバーレイ */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <div
        className={`absolute bottom-full mb-2 z-40 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-3 flex flex-col gap-1.5 animate-fade-in ${
          align === 'left' ? 'left-0' : 'right-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-bold text-stone-900">{character.name}</p>
        <p className="text-xs text-stone-500">
          {character.job} ／ HP {character.maxHp}
        </p>
        <div className="h-px bg-stone-100 my-0.5" />
        <p className="text-xs font-semibold text-indigo-700">{character.skillName}</p>
        <p className="text-xs text-stone-600 leading-relaxed">{character.skillDescription}</p>
      </div>
    </>
  );
}
