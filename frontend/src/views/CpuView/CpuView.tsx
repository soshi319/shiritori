import { useEffect, useState } from 'react';
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
import { getRequiredNextStart, normalizeWordForComparison } from 'shared/logic/shiritoriValidator';
import { checkWordExists } from '../../utils/checkWordExists'; // 辞書チェック用

export type PlayerState = {
  id: string;
  name: string;
  characterId: string;
  hp: number;
  maxHp: number;
  hasEndured: boolean;
  poisonStacks: number;
  comboCount: number;
  lastWordLength: number | null;
};

const HIRAGANA_ONLY_REGEX = /^[ぁ-んー]+$/;

// 濁点・半濁点（◯）文字判定用の正規表現（ぱぴぷぺぽ等の半濁点も網羅）
const HAS_DAKUTEN_OR_HANDAKUTEN_REGEX = /[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゔガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴ]/;

const CPU_DICTIONARY: Record<string, string[]> = {
  "あ": ["あめ", "あさがお", "あき", "あかん"],
  "い": ["いか", "いす", "いと", "いおん"],
  "う": ["うみ", "うし", "うさぎ", "うどん"],
  "え": ["えき", "えんぴつ", "えのぐ", "えん"],
  "お": ["おにぎり", "おもちゃ", "おかし", "おんせん"],
  "か": ["かさ", "かめ", "からす", "かん"],
  "き": ["きつね", "きのこ", "きり", "きりん"],
  "く": ["くま", "くつ", "くすり", "くん"],
  "け": ["けしごむ", "けいと", "けむり", "けん"],
  "こ": ["こま", "こいぬ", "ことり", "こん"],
  "さ": ["さかな", "さる", "さくら", "さん"],
  "し": ["しか", "しお", "しんぶん", "しん"],
  "す": ["すいか", "すずめ", "すな", "すん"],
  "せ": ["せんせい", "せっけん", "せなか", "せん"],
  "そ": ["そら", "そうじき", "そり", "そん"],
  "た": ["たいこ", "たぬき", "たまご", "たん"],
  "ち": ["ちず", "ちきゅう", "ちえ", "ちん"],
  "つ": ["つくえ", "つばめ", "つき", "つん"],
  "て": ["てがみ", "てんとうむし", "てぶくろ", "てん"],
  "と": ["とら", "とまと", "とうもろこし", "とん"],
  "な": ["なす", "なわとび", "なみ", "なん"],
  "に": ["にんじん", "にわとり", "にじ", "にん"],
  "ぬ": ["ぬりえ", "ぬいぐるみ", "ぬま", "ぬん"],
  "ね": ["ねこ", "ねずみ", "ねんど", "ねん"],
  "の": ["のこぎり", "のり", "のぼり", "のん"],
  "は": ["はさみ", "はと", "はな", "はん"],
  "ひ": ["ひこうき", "ひまわり", "ひつじ", "ひん"],
  "ふ": ["ふうせん", "ふね", "ふで", "ふん"],
  "へ": ["へや", "へび", "へい", "へん"],
  "ほ": ["ほし", "ほたる", "ほんとう", "ほん"],
  "ま": ["まくら", "まつり", "まめ", "まん"],
  "み": ["みかん", "みず", "みどり", "みん"],
  "む": ["むし", "むぎ", "むすめ", "むん"],
  "め": ["めがね", "めだか", "めろん", "めん"],
  "も": ["もも", "もみじ", "もち", "もん"],
  "や": ["やま", "やさい", "やかん", "やん"],
  "ゆ": ["ゆき", "ゆり", "ゆうき", "ゆん"],
  "よ": ["よる", "よぞら", "ようかい", "よん"],
  "ら": ["らいおん", "らっぱ", "らくがき", "らん"],
  "り": ["りす", "りぼん", "りこぴん", "りん"],
  "る": ["るす", "るーる", "るびー", "るん"],
  "れ": ["れもん", "れんが", "れんず", "れん"],
  "ろ": ["ろば", "ろうそく", "ろけっと", "ろん"],
  "わ": ["わに", "わたあめ", "わな", "わん"],
  "default": ["りんご", "ごま", "まり", "みかん"] 
};

const calculateBaseDamage = (word: string) => {
  const len = word.length;
  if (len === 1) return 40;
  if (len === 2) return 25;
  if (len === 3) return 15;
  if (len === 4) return 10;
  return 5;
};

type CpuViewProps = {
  changeScreen: (screen: Screen) => void;
  selectedCharId: string;
};

type CharAnimState = 'IDLE' | 'ATTACK' | 'REFLECT_BACK' | 'HIT_SHAKE';

export function CpuView({ changeScreen, selectedCharId }: CpuViewProps) {
  const [status, setStatus] = useState<'CONNECTING' | 'WAITING' | 'ANNOUNCING' | 'PLAYING' | 'GAME_OVER'>('CONNECTING');
  
  const [myState, setMyState] = useState<PlayerState | null>(null);
  const [opponentState, setOpponentState] = useState<PlayerState | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string>('me');
  const [turnId, setTurnId] = useState<number>(0);
  
  const [currentWord, setCurrentWord] = useState('しりとり');
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set(['しりとり']));
  const [history, setHistory] = useState<string[]>(['しりとり']);
  const [log, setLog] = useState<string[]>([]);
  
  const [winnerId, setWinnerId] = useState<string | null>(null);
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

  const myCharacter = characters.find((c) => c.id === myState?.characterId) || characters[0];

  const requiredStartNow = getRequiredNextStart(currentWord);
  const isMyTurn = myState && activePlayerId === myState.id;
  const isWaitingSync = myInputWord !== null && cpuInputWord === null;
  const isGameOver = status === 'GAME_OVER';

  useEffect(() => {
    const meChar = characters.find(c => c.id === selectedCharId) || characters[0];
    const cpuIds = ["A", "B", "C", "D"];
    const randomCpuId = cpuIds[Math.floor(Math.random() * cpuIds.length)];
    const cpuChar = characters.find(c => c.id === randomCpuId) || characters[3];

    setMyState({
      id: 'me',
      name: 'あなた',
      characterId: meChar.id,
      hp: meChar.maxHp,
      maxHp: meChar.maxHp,
      poisonStacks: 0,
      hasEndured: false,
      comboCount: 0,
      lastWordLength: null
    });

    setOpponentState({
      id: 'cpu',
      name: `CPU (${cpuChar.name})`,
      characterId: cpuChar.id,
      hp: cpuChar.maxHp,
      maxHp: cpuChar.maxHp,
      poisonStacks: 0,
      hasEndured: false,
      comboCount: 0,
      lastWordLength: null
    });

    setStatus('ANNOUNCING');
    setActivePlayerId('me');

    const startTimer = setTimeout(() => {
      setStatus('PLAYING');
      setTurnId(1);
      setLog(['対戦相手が見つかりました！バトルスタート！']);
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

  // CPU思考ルーチン
  useEffect(() => {
    if (status !== 'PLAYING' || isGameOver) return;
    if (cpuInputWord !== null) return;

    const delay = Math.random() * 1500 + 1500;
    
    const cpuActionTimer = setTimeout(() => {
      const startChar = requiredStartNow;
      const wordList = CPU_DICTIONARY[startChar] || CPU_DICTIONARY["default"];
      
      const isCpuBakudanReady = opponentState && opponentState.hp <= 30;
      let chosenWord = "";

      if (!isMyTurn) {
        if (isCpuBakudanReady) {
          const bakudanWord = wordList.find(w => w.length === 4 && w.endsWith('ん') && !usedWords.has(w));
          if (bakudanWord) {
            chosenWord = bakudanWord;
          }
        }

        if (!chosenWord) {
          const validWordsList = wordList.filter(w => !usedWords.has(w) && !w.endsWith('ん'));
          if (validWordsList.length > 0) {
            chosenWord = validWordsList[0]; 
          } else {
            chosenWord = wordList[0]; 
          }
        }
      } else {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        chosenWord = wordList[randomIndex];
      }

      setCpuInputWord(chosenWord);
    }, delay);

    return () => clearTimeout(cpuActionTimer);
  }, [status, turnId, isMyTurn, cpuInputWord, requiredStartNow, usedWords, isGameOver, opponentState]);

  useEffect(() => {
    if (myInputWord !== null && cpuInputWord !== null && !isResolving) {
      setIsResolving(true);
      resolveTurn(myInputWord, cpuInputWord);
    }
  }, [myInputWord, cpuInputWord, isResolving]);

  const resolveTurn = (myWord: string, cpuWord: string) => {
    if (!myState || !opponentState) return;
    const isAttackerMe = activePlayerId === 'me';
    const attackerWord = isAttackerMe ? myWord : cpuWord;
    const defenderWord = isAttackerMe ? cpuWord : myWord;

    const myCharId = myState.characterId;
    const opCharId = opponentState.characterId;
    const attackerCharId = isAttackerMe ? myCharId : opCharId;

    const attackerHp = isAttackerMe ? myState.hp : opponentState.hp;

    const isBakudan = attackerHp <= 30 && attackerWord.length === 4 && attackerWord.endsWith('ん');
    const isInvalidN = attackerWord.endsWith('ん') && !isBakudan;

    if (isInvalidN || usedWords.has(attackerWord)) {
      const who = isAttackerMe ? 'あなた' : '相手';
      const reason = isInvalidN ? '「ん」で終わっています' : 'すでに使われた言葉です';
      
      setLog(prev => [`${who}の「${attackerWord}」は無効: ${reason}`, ...prev]);
      
      if (isAttackerMe) {
        setMyState(prev => prev ? { ...prev, hp: 0 } : prev);
        setWinnerId('cpu');
      } else {
        setOpponentState(prev => prev ? { ...prev, hp: 0 } : prev);
        setWinnerId('me');
      }
      setStatus('GAME_OVER');
      setGameOverReason('hp_zero');
      return;
    }

    setUsedWords(prev => new Set(prev).add(attackerWord));
    setHistory(prev => [...prev, attackerWord]);
    setCurrentWord(attackerWord);

    let dmg = 0;
    if (isBakudan) {
      dmg = calculateBaseDamage(attackerWord) * 8; 
    } else {
      dmg = calculateBaseDamage(attackerWord);
    }

    let newComboCount = 0;

    if (attackerCharId === 'C' && !isBakudan) {
      const lastLen = isAttackerMe ? myState.lastWordLength : opponentState.lastWordLength;
      const currentCombo = isAttackerMe ? myState.comboCount : opponentState.comboCount;
      
      newComboCount = (lastLen === attackerWord.length) ? currentCombo + 1 : 0;
      const multiplier = 1 + newComboCount * 0.2; 
      
      dmg = Math.ceil(dmg * multiplier);
    }

    const isReflected = attackerWord === defenderWord;

    let nextMyHp = myState.hp;
    let nextOpHp = opponentState.hp;
    let nextMyCombo = myState.comboCount;
    let nextOpCombo = opponentState.comboCount;
    let nextMyPoison = myState.poisonStacks;
    let nextOpPoison = opponentState.poisonStacks;
    let nextMyEndured = myState.hasEndured;
    let nextOpEndured = opponentState.hasEndured;

    if (isReflected) {
      let reflectDmg = dmg;
      
      if (attackerCharId === 'B') {
        reflectDmg = Math.ceil(reflectDmg / 2);
      }

      setLog(prev => [
        isAttackerMe
          ? `相手に読まれた！あなたの「${attackerWord}」が反射され、自分に${reflectDmg}ダメージ！${attackerCharId === 'B' ? '（軽減）' : ''}`
          : `反射成功！相手の「${attackerWord}」を跳ね返し、相手に${reflectDmg}ダメージ！${attackerCharId === 'B' ? '（軽減）' : ''}`,
        ...prev,
      ]);
      setEffect({ id: Date.now(), type: 'reflect', damage: reflectDmg });

      if (isAttackerMe) {
        setMyAnim('REFLECT_BACK');
        nextMyHp = Math.max(0, nextMyHp - reflectDmg);
        nextMyCombo = 0; 
      } else {
        setOpponentAnim('REFLECT_BACK');
        nextOpHp = Math.max(0, nextOpHp - reflectDmg);
        nextOpCombo = 0; 
      }
    } else {
      setLog(prev => [
        isAttackerMe
          ? `${isBakudan ? '⚡️一閃発動！⚡️ ' : ''}あなたの「${attackerWord}」で相手に${dmg}ダメージ！`
          : `${isBakudan ? '⚡️一閃発動！⚡️ ' : ''}相手の「${attackerWord}」であなたが${dmg}ダメージを受けた！`,
        ...prev,
      ]);
      setEffect({ id: Date.now(), type: 'hit', damage: dmg });

      if (isAttackerMe) {
        setMyAnim('ATTACK');
        setOpponentAnim('HIT_SHAKE');
        nextOpHp = Math.max(0, nextOpHp - dmg);

        if (attackerCharId === 'C' && !isBakudan) {
          nextMyCombo = newComboCount;
          if (nextMyCombo >= 2) setComboBurst(nextMyCombo);
        } else {
          nextMyCombo = 0;
        }

        // 【ドロシー(D)毒付与仕様】濁点・半濁点がある場合のみ毒を付与
        if (attackerCharId === 'D') {
          const hasDakutenOrHandakuten = HAS_DAKUTEN_OR_HANDAKUTEN_REGEX.test(attackerWord);
          if (hasDakutenOrHandakuten) {
            nextOpPoison += 1;
            setPoisonBurst((prev) => prev + 1);
            setLog(prev => [`ドロシーの魔力！「${attackerWord}」の濁音・半濁音により、相手に毒を付与した！`, ...prev]);
          } else {
            setLog(prev => [`「${attackerWord}」に濁音・半濁音がないため、ドロシーの毒は付与されなかった。`, ...prev]);
          }
        }

      } else {
        setOpponentAnim('ATTACK');
        setMyAnim('HIT_SHAKE');
        nextMyHp = Math.max(0, nextMyHp - dmg);

        if (attackerCharId === 'C' && !isBakudan) {
          nextOpCombo = newComboCount;
          if (nextOpCombo >= 2) setComboBurst(nextOpCombo);
        } else {
          nextOpCombo = 0;
        }

        // 【相手がドロシー(D)の場合】
        if (attackerCharId === 'D') {
          const hasDakutenOrHandakuten = HAS_DAKUTEN_OR_HANDAKUTEN_REGEX.test(attackerWord);
          if (hasDakutenOrHandakuten) {
            nextMyPoison += 1;
            setPoisonBurst((prev) => prev + 1);
            setLog(prev => [`毒を受けた…（「${attackerWord}」に濁音・半濁音があるため）`, ...prev]);
          } else {
            setLog(prev => [`相手の「${attackerWord}」には濁音・半濁音がないため、毒は受けなかった。`, ...prev]);
          }
        }
      }
    }

    if (nextMyHp <= 0 && myCharId === 'A' && !nextMyEndured) {
      nextMyHp = 1;
      nextMyEndured = true;
      setLog(prev => ['アレスの能力発動！致命傷を1HPで耐えた！', ...prev]);
    }
    if (nextOpHp <= 0 && opCharId === 'A' && !nextOpEndured) {
      nextOpHp = 1;
      nextOpEndured = true;
      setLog(prev => ['相手のアレスが能力発動！致命傷を1HPで耐えた！', ...prev]);
    }

    const isGameOverAfterMain = nextMyHp <= 0 || nextOpHp <= 0;

    if (!isGameOverAfterMain) {
      if (nextMyPoison > 0) {
        const pDmg = nextMyPoison * 5; 
        nextMyHp -= pDmg;
        setLog(prev => [`毒の効果で${pDmg}ダメージを受けた…`, ...prev]);
      }
      if (nextOpPoison > 0) {
        const pDmg = nextOpPoison * 5;
        nextOpHp -= pDmg;
        setLog(prev => [`相手は毒の効果で${pDmg}ダメージを受けている！`, ...prev]);
      }
    }

    setMyState(prev => prev ? { 
      ...prev, hp: Math.max(0, nextMyHp), comboCount: nextMyCombo, poisonStacks: nextMyPoison, hasEndured: nextMyEndured, 
      lastWordLength: isAttackerMe ? attackerWord.length : prev.lastWordLength 
    } : prev);
    
    setOpponentState(prev => prev ? { 
      ...prev, hp: Math.max(0, nextOpHp), comboCount: nextOpCombo, poisonStacks: nextOpPoison, hasEndured: nextOpEndured, 
      lastWordLength: isAttackerMe ? prev.lastWordLength : attackerWord.length 
    } : prev);

    if (nextMyHp <= 0 || nextOpHp <= 0) {
      setStatus('GAME_OVER');
      setWinnerId(nextMyHp <= 0 && nextOpHp <= 0 ? 'draw' : nextMyHp <= 0 ? 'cpu' : 'me');
      setGameOverReason(isGameOverAfterMain ? 'hp_zero' : 'poison');
      return;
    }

    setActivePlayerId(isAttackerMe ? 'cpu' : 'me');
    setTurnId(prev => prev + 1);
    setMyInputWord(null);
    setCpuInputWord(null);
    setIsResolving(false);
  };

  const handleSubmitWord = async (word: string) => {
    if (status !== 'PLAYING' || isGameOver || isChecking) return;
    
    const hiraWord = normalizeWordForComparison(word);

    // 1. ひらがなのみの入力かチェック
    if (!HIRAGANA_ONLY_REGEX.test(hiraWord)) {
      setInputError('ひらがなで入力してください');
      return;
    }

    // 2. 開始文字チェック
    if (!hiraWord.startsWith(requiredStartNow)) {
      setInputError(`「${requiredStartNow}」から始まる言葉を入力してください！`);
      return;
    }

    // 3. 重複チェック
    if (usedWords.has(hiraWord)) {
      setInputError(`「${hiraWord}」はすでに使用されています。`);
      return;
    }

    // 4. 辞書存在チェック（バックグラウンド処理）
    setIsChecking(true);
    setInputError(null);

    try {
      const exists = await checkWordExists(hiraWord);
      if (!exists) {
        setInputError(`「${hiraWord}」は辞書に見つかりませんでした。別の単語を試してください。`);
        setIsChecking(false);
        return;
      }
    } catch (err) {
      console.error("辞書チェック中にエラーが発生しました:", err);
      setInputError("通信エラーのため、辞書チェックに失敗しました。");
      setIsChecking(false);
      return;
    }

    setIsChecking(false);
    setInputError(null);
    setMyInputWord(hiraWord); 
  };

  const handleTimeUp = () => {
    if (status !== 'PLAYING') return;

    if (myInputWord === null && myState) {
      setLog(prev => [`時間切れ！あなたが20ダメージを受けた！`, ...prev]);
      setMyState(prev => {
        if (!prev) return prev;
        let nextHp = Math.max(0, prev.hp - 20);
        let nextEndured = prev.hasEndured;

        if (nextHp <= 0 && prev.characterId === 'A' && !nextEndured) {
          nextHp = 1;
          nextEndured = true;
          setLog(p => ['アレスの能力発動！致命傷を1HPで耐えた！', ...p]);
        }

        if (nextHp <= 0) {
          setStatus('GAME_OVER');
          setWinnerId('cpu');
          setGameOverReason('time_up');
        }
        return { ...prev, hp: nextHp, comboCount: 0, hasEndured: nextEndured, lastWordLength: null };
      });

      setMyInputWord(null);
      setCpuInputWord(null);
      setIsResolving(false);
      setActivePlayerId(isMyTurn ? 'cpu' : 'me');
      setTurnId(prev => prev + 1);
    }
  };

  if (status === 'CONNECTING') {
    return <div className="fixed inset-0 flex items-center justify-center flex-col gap-4 bg-zinc-400 text-zinc-900">サーバーに接続中...</div>;
  }

  if (status === 'WAITING') {
    return (
      <div className="fixed inset-0 flex items-center justify-center flex-col gap-4 bg-zinc-400 text-zinc-900">
        <div className="animate-spin h-10 w-10 border-4 border-zinc-600 rounded-full border-t-transparent"></div>
        <p className="text-sm font-bold tracking-wide text-zinc-800">対戦相手を待っています...</p>
      </div>
    );
  }

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
              <img
                src={`/images/${myState.characterId}.png`}
                alt="自分のキャラクター"
                className="w-full h-full object-contain -scale-x-100 drop-shadow-md"
              />
            </div>
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
              <img
                src={`/images/${opponentState.characterId}.png`}
                alt="相手のキャラクター"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
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
          <TurnTimer turnId={turnId} duration={40} onTimeUp={handleTimeUp} />
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
              <div className="w-full">
                <WordInputField 
                  onSubmit={handleSubmitWord} 
                  disabled={false} 
                  isMyTurn={isMyTurn ?? false} 
                  requiredStart={requiredStartNow} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-2xl font-black text-zinc-900 tracking-wide">
              {myState?.id === winnerId ? '🎉 あなたの勝利！' : myState?.id === 'draw' ? '🤝 引き分け' : '💀 あなたの敗北...'}
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