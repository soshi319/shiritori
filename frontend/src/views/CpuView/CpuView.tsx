import { useEffect, useRef, useState } from 'react';
import type { Screen } from '../../types/screen';
import { characters } from 'shared/data/characters';
import { HpBar } from '../../components/game/HpBar';
import { TurnTimer } from '../../components/game/TurnTimer';
import { WordInputField } from '../../components/game/WordInputField';
import { FirstTurnAnnouncement } from '../../components/game/FirstTurnAnnouncement';
import { CounterEffect, type EffectData } from '../../components/game/CounterEffect';
import { ComboIndicator } from '../../components/game/ComboIndicator';
import { PoisonBadge } from '../../components/game/PoisonBadge';
import { ComboBurstEffect } from '../../components/game/ComboBurstEffect';
import { PoisonBurstEffect } from '../../components/game/PoisonBurstEffect';
import { BakudanReadyBadge } from '../../components/game/BakudanReadyBadge';
import { CharacterSkillPopover } from '../../components/game/CharacterSkillPopover';
import type { PlayerState } from 'shared/types/messageTypes';
import {
  getRequiredNextStart,
  normalizeWordForComparison,
  validateWord,
} from 'shared/logic/shiritoriValidator';
// ★ turnResolver.ts は shared/logic/ に置く前提（gameRoom.ts と全く同じロジックをフロントでも使う）
import { resolveTurn } from 'shared/logic/turnResolver';
import { GAME_CONFIG } from 'shared/config/gameConfig';
// ★ CPU用の固定辞書。サーバー側 GameRoom.handleCpuAttack と共通のものを使う
import { CPU_DICTIONARY } from 'shared/data/cpuDictionary';
import { checkWordExists } from '../../utils/checkWordExists';

const HIRAGANA_ONLY_REGEX = /^[ぁ-んー]+$/;

type CpuViewProps = {
  changeScreen: (screen: Screen) => void;
  selectedCharId: string;
};

type CharAnimState = 'IDLE' | 'ATTACK' | 'REFLECT_BACK' | 'HIT_SHAKE';
type LocalId = 'me' | 'cpu';

export function CpuView({ changeScreen, selectedCharId }: CpuViewProps) {
  const [status, setStatus] = useState<'ANNOUNCING' | 'PLAYING' | 'GAME_OVER'>('ANNOUNCING');

  const [myState, setMyState] = useState<PlayerState | null>(null);
  const [opponentState, setOpponentState] = useState<PlayerState | null>(null);

  const [activePlayerId, setActivePlayerId] = useState<LocalId>('me');
  const [turnId, setTurnId] = useState<number>(0);

  const [currentWord, setCurrentWord] = useState('しりとり');
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set(['しりとり']));
  const [history, setHistory] = useState<string[]>(['しりとり']);
  const [log, setLog] = useState<string[]>([]);

  const [winnerId, setWinnerId] = useState<LocalId | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const [comboBurst, setComboBurst] = useState<number | null>(null);
  const [poisonBurst, setPoisonBurst] = useState(0);
  const [effect, setEffect] = useState<EffectData | null>(null);

  const [myAnim, setMyAnim] = useState<CharAnimState>('IDLE');
  const [opponentAnim, setOpponentAnim] = useState<CharAnimState>('IDLE');

  const [myInputWord, setMyInputWord] = useState<string | null>(null);
  const [cpuInputWord, setCpuInputWord] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // CPUが音ごとに何番目まで単語を使ったかを覚えておく（stateにせずrefで持つ）
  const cpuMoraIndexRef = useRef<Map<string, number>>(new Map());
  // 連続タイムアップ回数（本家GameRoomのconsecutiveTimeoutsと同じ役割）
  const consecutiveTimeoutsRef = useRef(0);

  const myCharacter = characters.find((c) => c.id === myState?.characterId) || characters[0];
  const opponentCharacter = characters.find((c) => c.id === opponentState?.characterId) || characters[0];
  const [openSkillFor, setOpenSkillFor] = useState<'me' | 'opponent' | null>(null);

  const requiredStartNow = getRequiredNextStart(currentWord);
  const isMyTurn = myState !== null && activePlayerId === myState.id;
  const isWaitingSync = myInputWord !== null && cpuInputWord === null;
  const isGameOver = status === 'GAME_OVER';

  // 初期化：キャラクター決定＋先攻/後攻をランダムに決定し、後攻にHPボーナスを付与
  // （本家 GameRoom.start() と同じルール）
  useEffect(() => {
    const meChar = characters.find((c) => c.id === selectedCharId) || characters[0];
    const cpuCandidateIds = characters.map((c) => c.id).filter((id) => id !== selectedCharId);
    const randomCpuId = cpuCandidateIds[Math.floor(Math.random() * cpuCandidateIds.length)]
      ?? characters[0].id;
    const cpuChar = characters.find((c) => c.id === randomCpuId)!;

    const first: LocalId = Math.random() < 0.5 ? 'me' : 'cpu';

    setMyState({
      id: 'me',
      name: 'あなた',
      characterId: meChar.id,
      hp: meChar.maxHp + (first === 'cpu' ? GAME_CONFIG.SECOND_TURN_HP_BONUS : 0),
      maxHp: meChar.maxHp,
      poisonStacks: 0,
      hasEndured: false,
      comboCount: 0,
      lastWordLength: null,
    });

    setOpponentState({
      id: 'cpu',
      name: `CPU（${cpuChar.name}）`,
      characterId: cpuChar.id,
      hp: cpuChar.maxHp + (first === 'me' ? GAME_CONFIG.SECOND_TURN_HP_BONUS : 0),
      maxHp: cpuChar.maxHp,
      poisonStacks: 0,
      hasEndured: false,
      comboCount: 0,
      lastWordLength: null,
    });

    setActivePlayerId(first);
    setStatus('ANNOUNCING');

    const startTimer = setTimeout(() => {
      setStatus('PLAYING');
      setTurnId(1);
      setLog(['バトルスタート！']);
    }, 2500);

    return () => clearTimeout(startTimer);
  }, [selectedCharId]);

  useEffect(() => {
    if (poisonBurst === 0) return;
    const timer = setTimeout(() => setPoisonBurst(0), 1600);
    return () => clearTimeout(timer);
  }, [poisonBurst]);

  useEffect(() => {
    if (comboBurst === null) return;
    const timer = setTimeout(() => setComboBurst(null), 1200);
    return () => clearTimeout(timer);
  }, [comboBurst]);

  useEffect(() => {
    if (!effect) return;
    const timer = setTimeout(() => {
      setEffect(null);
      setMyAnim('IDLE');
      setOpponentAnim('IDLE');
    }, 600);
    return () => clearTimeout(timer);
  }, [effect]);

  // 2回連続でパスになった側の負け、それ以外は何もなくターンを渡すだけ（本家と同じ仕様）
  function applyPass(whoTimedOut: LocalId) {
    const timeoutCount = consecutiveTimeoutsRef.current + 1;
    consecutiveTimeoutsRef.current = timeoutCount;

    if (timeoutCount >= 2) {
      setWinnerId(whoTimedOut === 'me' ? 'cpu' : 'me');
      setGameOverReason('time_up');
      setStatus('GAME_OVER');
      return;
    }

    setLog((prev) => [
      whoTimedOut === 'me'
        ? '時間切れのため、ターンをパスしました'
        : 'CPUが答えられず、ターンをパスしました',
      ...prev,
    ]);

    setActivePlayerId(whoTimedOut === 'me' ? 'cpu' : 'me');
    setTurnId((prev) => prev + 1);
    setMyInputWord(null);
    setCpuInputWord(null);
    setIsResolving(false);
    setInputError(null);
  }

  // CPU思考ルーチン：
  // 自分（CPU）が攻撃側なら固定辞書から未使用の単語を順番に選ぶ。
  // 自分が防御側（プレイヤーが攻撃側）なら、反射を狙うためのランダムな予測を立てる。
  useEffect(() => {
    if (status !== 'PLAYING' || isGameOver) return;
    if (cpuInputWord !== null) return;
    if (!myState || !opponentState) return;

    const delay = Math.random() * 1500 + 1500;

    const cpuActionTimer = setTimeout(() => {
      const candidates = CPU_DICTIONARY[requiredStartNow];

      if (!isMyTurn) {
        // CPUが攻撃側
        let chosenWord: string | null = null;

        if (candidates && candidates.length > 0) {
          const finisher = candidates[candidates.length - 1];

          // 自分のHPが必殺技の目安（30以下）で、かつ本当に一閃が成立する
          // ちょうど4文字の「ん」終わり単語がまだ残っていれば、それを狙って選ぶ
          if (
            opponentState.hp <= 30 &&
            finisher.length === 4 &&
            finisher.endsWith('ん') &&
            !usedWords.has(finisher)
          ) {
            chosenWord = finisher;
          } else {
            let idx = cpuMoraIndexRef.current.get(requiredStartNow) ?? 0;
            while (idx < candidates.length && usedWords.has(candidates[idx])) {
              idx++;
            }
            if (idx < candidates.length) {
              cpuMoraIndexRef.current.set(requiredStartNow, idx + 1);
              chosenWord = candidates[idx];
            }
          }
        }

        if (!chosenWord) {
          // 持ち駒が尽きた・その音の単語を持っていない場合は、タイムアップと同じ扱いにする
          applyPass('cpu');
          return;
        }

        setCpuInputWord(chosenWord);
      } else {
        // CPUが防御側：反射狙いのランダムな予測（外れても何も起きない）
        const guess = candidates && candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : '';
        setCpuInputWord(guess);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, delay);

    return () => clearTimeout(cpuActionTimer);
  }, [status, turnId, isMyTurn, cpuInputWord, requiredStartNow, usedWords, isGameOver, myState, opponentState]);

  useEffect(() => {
    if (myInputWord !== null && cpuInputWord !== null && !isResolving) {
      setIsResolving(true);
      resolveCurrentTurn(myInputWord, cpuInputWord);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myInputWord, cpuInputWord, isResolving]);

  // ターン解決：本家サーバーの resolveCurrentTurn と全く同じ validateWord / resolveTurn を使う
  function resolveCurrentTurn(myWord: string, cpuWord: string) {
    if (!myState || !opponentState) return;

    const isAttackerMe = activePlayerId === 'me';
    const attackerWord = isAttackerMe ? myWord : cpuWord;
    const defenderWord = isAttackerMe ? cpuWord : myWord;

    const attackerState = isAttackerMe ? myState : opponentState;
    const defenderState = isAttackerMe ? opponentState : myState;

    const isReflected = attackerWord !== '' && defenderWord !== '' &&
      normalizeWordForComparison(attackerWord) === normalizeWordForComparison(defenderWord);

    const valResult = validateWord(
      attackerWord,
      currentWord,
      usedWords,
      attackerState.hp,
      attackerState.characterId,
    );

    if (!valResult.isValid) {
      const who = isAttackerMe ? 'あなた' : '相手';
      setLog((prev) => [`${who}の「${attackerWord}」は無効: ${valResult.errorMessage}`, ...prev]);

      if (valResult.failureReason === 'nounEnding') {
        setWinnerId(isAttackerMe ? 'cpu' : 'me');
        setGameOverReason('bakudan_failed');
        setStatus('GAME_OVER');
        return;
      }

      consecutiveTimeoutsRef.current = 0;
      setActivePlayerId(isAttackerMe ? 'cpu' : 'me');
      setTurnId((prev) => prev + 1);
      setMyInputWord(null);
      setCpuInputWord(null);
      setIsResolving(false);
      setInputError(null);
      return;
    }

    consecutiveTimeoutsRef.current = 0;

    const newUsedWords = new Set(usedWords);
    newUsedWords.add(attackerWord);
    setHistory((prev) => (prev.includes(attackerWord) ? prev : [...prev, attackerWord]));
    setCurrentWord(attackerWord);

    const result = resolveTurn(attackerWord, valResult.isBakudan, isReflected, attackerState, defenderState);
    if (valResult.triggersPoison) result.nextOpponentState.poisonStacks += 1;

    const nextAttackerState = result.nextMyState;
    const nextDefenderState = result.nextOpponentState;

    const prevAttackerCombo = attackerState.comboCount;
    const prevAttackerPoison = attackerState.poisonStacks;
    const prevDefenderPoison = defenderState.poisonStacks;

    if (isAttackerMe) {
      setMyState(nextAttackerState);
      setOpponentState(nextDefenderState);
    } else {
      setOpponentState(nextAttackerState);
      setMyState(nextDefenderState);
    }

    if (result.effect) {
      setEffect(result.effect);
      const { type, damage } = result.effect;

      if (type === 'hit') {
        if (isAttackerMe) { setMyAnim('ATTACK'); setOpponentAnim('HIT_SHAKE'); }
        else { setOpponentAnim('ATTACK'); setMyAnim('HIT_SHAKE'); }

        setLog((prev) => [
          isAttackerMe
            ? `${valResult.isBakudan ? '⚡️一閃発動！⚡️ ' : ''}あなたの「${attackerWord}」で相手に${damage}ダメージ！`
            : `${valResult.isBakudan ? '⚡️一閃発動！⚡️ ' : ''}相手の「${attackerWord}」であなたが${damage}ダメージを受けた！`,
          ...prev,
        ]);
      } else {
        if (isAttackerMe) setMyAnim('REFLECT_BACK'); else setOpponentAnim('REFLECT_BACK');

        setLog((prev) => [
          isAttackerMe
            ? `相手に読まれた！あなたの「${attackerWord}」が反射され、自分に${damage}ダメージ！`
            : `反射成功！相手の「${attackerWord}」を跳ね返し、相手に${damage}ダメージ！`,
          ...prev,
        ]);
      }
    } else {
      setLog((prev) => [`「${attackerWord}」！`, ...prev]);
    }

    if (nextAttackerState.comboCount > prevAttackerCombo && nextAttackerState.comboCount >= 2) {
      setComboBurst(nextAttackerState.comboCount);
    }

    if (
      nextAttackerState.poisonStacks > prevAttackerPoison ||
      nextDefenderState.poisonStacks > prevDefenderPoison
    ) {
      setPoisonBurst((prev) => prev + 1);
      setLog((prev) => [isAttackerMe ? '相手に毒を付与した！' : '毒を受けた…体が重い', ...prev]);
    }

    if (result.poisonDamage) {
      const humanDmg = isAttackerMe ? result.poisonDamage.myDamage : result.poisonDamage.opponentDamage;
      const cpuDmg = isAttackerMe ? result.poisonDamage.opponentDamage : result.poisonDamage.myDamage;
      if (humanDmg > 0) setLog((prev) => [`毒の効果で${humanDmg}ダメージを受けた…`, ...prev]);
      if (cpuDmg > 0) setLog((prev) => [`相手は毒の効果で${cpuDmg}ダメージを受けている！`, ...prev]);
    }

    if (result.enduredPlayerId) {
      const enduredId = result.enduredPlayerId as LocalId; // idは常に 'me' | 'cpu'
      setLog((prev) => [
        enduredId === 'me' ? 'あなたの能力発動！致命傷を1HPで耐えた！' : '相手の能力発動！致命傷を1HPで耐えた！',
        ...prev,
      ]);
      const specialWord = 'アレスの足搔き・あ';
      newUsedWords.add(specialWord);
      setCurrentWord(specialWord);
      setActivePlayerId(enduredId);
    } else {
      setActivePlayerId(isAttackerMe ? 'cpu' : 'me');
    }

    setUsedWords(newUsedWords);
    setTurnId((prev) => prev + 1);
    setMyInputWord(null);
    setCpuInputWord(null);
    setIsResolving(false);
    setInputError(null);

    if (result.gameOverReason) {
      const myFinalHp = isAttackerMe ? nextAttackerState.hp : nextDefenderState.hp;
      setWinnerId(myFinalHp > 0 ? 'me' : 'cpu');
      setGameOverReason(result.gameOverReason);
      setStatus('GAME_OVER');
    }
  }

  const handleSubmitWord = async (word: string) => {
    if (status !== 'PLAYING' || isGameOver || isChecking) return;
    if (myInputWord !== null) return;

    const hiraWord = normalizeWordForComparison(word);

    if (!HIRAGANA_ONLY_REGEX.test(hiraWord)) {
      setInputError('ひらがなで入力してください');
      return;
    }

    if (!hiraWord.startsWith(requiredStartNow)) {
      setInputError(`「${requiredStartNow}」から始まる言葉を入力してください！`);
      return;
    }

    if (usedWords.has(hiraWord)) {
      setInputError(`「${hiraWord}」はすでに使用されています。`);
      return;
    }

    setInputError(null);

    // 辞書チェックは、自分が攻撃側（アクティブプレイヤー）の時だけ行う（本家サーバーと同じ仕様。
    // 防御側の「予測」入力は辞書に無い言葉でも構わない）
    if (isMyTurn) {
      setIsChecking(true);
      try {
        const exists = await checkWordExists(hiraWord);
        if (!exists) {
          setInputError(`「${hiraWord}」は辞書に見つかりませんでした。別の単語を試してください。`);
          setIsChecking(false);
          return;
        }
      } catch (err) {
        console.error('辞書チェック中にエラーが発生しました:', err);
        setInputError('通信エラーのため、辞書チェックに失敗しました。');
        setIsChecking(false);
        return;
      }
      setIsChecking(false);
    }

    setMyInputWord(hiraWord);
  };

  const handleTimeUp = () => {
    if (status !== 'PLAYING' || isGameOver) return;
    if (!isMyTurn) return;
    if (myInputWord !== null) return;
    applyPass('me');
  };

  if (status === 'ANNOUNCING') {
    const isMeFirst = myState !== null && activePlayerId === myState.id;
    return (
      <FirstTurnAnnouncement
        isMeFirst={isMeFirst}
        opponentName={opponentState?.name ?? '相手'}
      />
    );
  }

  const matchingPastWords = history
    .filter((w) => w !== currentWord)
    .filter((w) => w.startsWith(requiredStartNow));

  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-2xl mx-auto bg-zinc-400">
      <CounterEffect effect={effect} />
      {comboBurst !== null && <ComboBurstEffect comboCount={comboBurst} />}
      {poisonBurst !== 0 && <PoisonBurstEffect />}

      <div className="flex-1 overflow-y-auto flex flex-col items-center gap-6 p-6">
        <div className="w-full flex justify-start">
          <button
            onClick={() => changeScreen('title')}
            className="text-sm text-zinc-700 hover:text-zinc-900 font-medium transition-colors"
          >
            ← タイトルへ戻る
          </button>
        </div>

        <div className="w-full flex justify-between gap-4">
          {myState && (
            <HpBar
              name={myCharacter.name}
              currentHp={myState.hp}
              maxHp={myState.maxHp}
              badge={
                <>
                  {myState.hp <= 30 && <BakudanReadyBadge />}
                  {myState.characterId === 'C' && <ComboIndicator comboCount={myState.comboCount} />}
                  <PoisonBadge poisonStacks={myState.poisonStacks} />
                </>
              }
            />
          )}
          {opponentState && (
            <HpBar
              name="相手"
              currentHp={opponentState.hp}
              maxHp={opponentState.maxHp}
              badge={
                <>
                  {opponentState.hp <= 30 && <BakudanReadyBadge />}
                  {opponentState.characterId === 'C' && <ComboIndicator comboCount={opponentState.comboCount} />}
                  <PoisonBadge poisonStacks={opponentState.poisonStacks} />
                </>
              }
            />
          )}
        </div>

        <div className="w-full flex justify-center items-end gap-5 sm:gap-36 mt-2 px-2 relative min-h-[160px]">
          {myState && (
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center transition-all ease-out relative ${
                myAnim === 'ATTACK' ? 'translate-x-16 duration-150 z-10' :
                myAnim === 'REFLECT_BACK' ? '-translate-x-12 duration-150' :
                myAnim === 'HIT_SHAKE' ? 'animate-shake duration-100' :
                'translate-x-0 duration-300'
              }`}
            >
              {effect?.type === 'reflect' && isMyTurn && (
                <div className="absolute inset-0 bg-sky-400/40 border-4 border-sky-300 rounded-full animate-ping pointer-events-none z-20" />
              )}
              <button
                onClick={() => setOpenSkillFor((prev) => (prev === 'me' ? null : 'me'))}
                className="w-full h-full"
                aria-label={`${myCharacter.name}の固有スキルを見る`}
              >
                <img
                  src={`/images/${myState.characterId}.png`}
                  alt="自分のキャラクター"
                  className="w-full h-full object-contain -scale-x-100 drop-shadow-md"
                />
              </button>
              {openSkillFor === 'me' && (
                <CharacterSkillPopover
                  character={myCharacter}
                  align="left"
                  onClose={() => setOpenSkillFor(null)}
                />
              )}            </div>
          )}

          {opponentState && (
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center transition-all ease-out relative ${
                opponentAnim === 'ATTACK' ? '-translate-x-16 duration-150 z-10' :
                opponentAnim === 'REFLECT_BACK' ? 'translate-x-12 duration-150' :
                opponentAnim === 'HIT_SHAKE' ? 'animate-shake duration-100' :
                'translate-x-0 duration-300'
              }`}
            >
              {effect?.type === 'reflect' && !isMyTurn && (
                <div className="absolute inset-0 bg-sky-400/40 border-4 border-sky-300 rounded-full animate-ping pointer-events-none z-20" />
              )}
              <button
                onClick={() => setOpenSkillFor((prev) => (prev === 'opponent' ? null : 'opponent'))}
                className="w-full h-full"
                aria-label={`${opponentCharacter.name}の固有スキルを見る`}
              >
                <img
                  src={`/images/${opponentState.characterId}.png`}
                  alt="相手のキャラクター"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </button>
              {openSkillFor === 'opponent' && (
                <CharacterSkillPopover
                  character={opponentCharacter}
                  align="right"
                  onClose={() => setOpenSkillFor(null)}
                />
              )}            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-zinc-700 font-medium">
            {isMyTurn ? 'あなたのターン' : '相手のターン（反射の準備！）'}
          </p>
          <p className="text-4xl font-black text-zinc-900 tracking-wider">
            「{currentWord}」
          </p>
        </div>

        {!isGameOver && (
          <TurnTimer turnId={turnId} duration={GAME_CONFIG.TURN_DURATION_SEC} onTimeUp={handleTimeUp} />
        )}

        <div className="w-full h-40 overflow-y-auto bg-white/60 rounded-xl p-3 text-sm flex flex-col gap-1 border border-zinc-300/50 shadow-sm">
          {log.map((entry, index) => (
            <p key={index} className={index === 0 ? 'text-zinc-900 font-bold' : 'text-zinc-600'}>{entry}</p>
          ))}
        </div>
      </div>

      {!isGameOver && isMyTurn && myState && myState.hp <= 30 && (
        <div className="w-full text-center animate-pulse">
          {myState.characterId === 'A' ? (
            <p className="text-2xl font-black text-red-700 tracking-wide drop-shadow-sm">
              🗡️ 「ん」で終わる 4文字で「一閃」発動！
            </p>
          ) : (
            <p className="text-xl font-black text-red-700 tracking-wide drop-shadow-sm">
              🗡️ 4文字で「ん」で終わる言葉で必殺技発動！
            </p>
          )}
        </div>
      )}

      <div className="sticky bottom-0 bg-zinc-300 p-4 border-t border-zinc-400/40 flex flex-col gap-4">
        {!isGameOver && matchingPastWords.length > 0 && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <p className="text-xs font-bold text-zinc-600 mb-1.5 px-1">
               「{requiredStartNow}」 から始まる使用済みの言葉
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {matchingPastWords.map((w, index) => (
                <span
                  key={index}
                  className="px-2.5 py-0.5 bg-zinc-200 border border-zinc-300 rounded-full text-xs font-medium text-zinc-700 shadow-sm"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {!isGameOver ? (
          <div className="flex flex-col w-full items-center">
            {inputError && (
              <p className="text-red-700 text-sm font-bold mb-2">{inputError}</p>
            )}

            {isWaitingSync ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="animate-spin h-6 w-6 border-4 border-zinc-500 rounded-full border-t-zinc-700"></div>
                <p className="text-zinc-700 font-semibold text-sm">相手の入力を待っています...</p>
              </div>
            ) : (
              <WordInputField
                onSubmit={handleSubmitWord}
                disabled={isChecking}
                isMyTurn={isMyTurn ?? false}
                requiredStart={requiredStartNow}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-2xl font-black text-zinc-900 tracking-wide">
              {winnerId === 'me' ? '🎉 あなたの勝利！' : '💀 あなたの敗北...'}
            </h2>
            <p className="text-sm text-zinc-700 font-medium">
              決着の理由:{' '}
              {gameOverReason === 'hp_zero' ? 'HPが0になった' :
               gameOverReason === 'time_up' ? '時間切れ' :
               gameOverReason === 'bakudan_failed' ? 'ばくだん自爆（即死）' :
               gameOverReason === 'poison' ? '毒によるダメージ' : '通信切断'}
            </p>
            <button
              onClick={() => changeScreen('title')}
              className="px-6 py-3 rounded-xl text-sm font-semibold tracking-wide bg-stone-800 hover:bg-stone-700 text-stone-100 transition-colors shadow-sm"
            >
              タイトルへ戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
