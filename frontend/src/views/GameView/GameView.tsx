import { useEffect, useState } from 'react';
import type { Screen } from '../../types/screen';
import { characters } from '../../data/characters';
import { calculateBaseDamage } from '../../utils/damageCalculator';
import { HpBar } from '../../components/game/HpBar';
import { TurnTimer } from '../../components/game/TurnTimer';
import { WordInputField } from '../../components/game/WordInputField';
import { CounterEffect, type EffectData } from '../../components/game/CounterEffect';

type GameViewProps = {
  changeScreen: (screen: Screen) => void;
  myCharacterId: string;
};

const DUMMY_PREDICTED_WORD = 'あああ';
const SECOND_TURN_HP_BONUS = 10;

export function GameView({ changeScreen, myCharacterId }: GameViewProps) {
  const myCharacter = characters.find((c) => c.id === myCharacterId)!;

  const [opponentCharacter] = useState(() => {
    const others = characters.filter((c) => c.id !== myCharacterId);
    return others[Math.floor(Math.random() * others.length)];
  });

  const [gameSetup] = useState(() => {
    const firstIsMe = Math.random() < 0.5;
    return {
      firstIsMe,
      myStartHp: myCharacter.maxHp + (firstIsMe ? 0 : SECOND_TURN_HP_BONUS),
      opponentStartHp: opponentCharacter.maxHp + (firstIsMe ? SECOND_TURN_HP_BONUS : 0),
    };
  });

  const [currentMyHp, setCurrentMyHp] = useState(gameSetup.myStartHp);
  const [currentOpponentHp, setCurrentOpponentHp] = useState(gameSetup.opponentStartHp);
  const [isPlayerTurn, setIsPlayerTurn] = useState(gameSetup.firstIsMe);

  const [turnId, setTurnId] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  const [effect, setEffect] = useState<EffectData | null>(null);
  const [effectCounter, setEffectCounter] = useState(0);

  function addLog(message: string) {
    setLog((prev) => [...prev, message]);
  }

  function applyCounterReduction(character: typeof myCharacter, damage: number) {
    if (character.skillType === 'counterReduction') {
      return Math.floor(damage / 2);
    }
    return damage;
  }

  function triggerEffect(type: 'reflect' | 'hit', damage: number) {
    setEffectCounter((prev) => prev + 1);
    setEffect({ id: effectCounter + 1, type, damage });
  }

  // ターンを進める共通処理（攻守交代）
  function advanceTurn() {
    setIsPlayerTurn((prev) => !prev);
    setTurnId((prev) => prev + 1);
  }

  // 通常のターン処理（単語が入力された場合）
  function resolveTurn(attackerWord: string) {
    if (isGameOver) return;

    const attacker = isPlayerTurn ? myCharacter : opponentCharacter;
    const isReflected = attackerWord === DUMMY_PREDICTED_WORD;
    const rawDamage = calculateBaseDamage(attacker, attackerWord);

    if (isReflected) {
      const finalDamage = applyCounterReduction(attacker, rawDamage);
      triggerEffect('reflect', finalDamage);

      if (isPlayerTurn) {
        const newHp = Math.max(0, currentMyHp - finalDamage);
        setCurrentMyHp(newHp);
        addLog(`反射！ あなたの「${attackerWord}」が跳ね返り、${finalDamage}ダメージを受けた！`);
        if (newHp <= 0) {
          setIsGameOver(true);
          addLog('あなたの敗北...');
          return;
        }
      } else {
        const newHp = Math.max(0, currentOpponentHp - finalDamage);
        setCurrentOpponentHp(newHp);
        addLog(`${opponentCharacter.name}の攻撃が反射され、${finalDamage}ダメージを受けた！`);
        if (newHp <= 0) {
          setIsGameOver(true);
          addLog('あなたの勝利！');
          return;
        }
      }
    } else {
      triggerEffect('hit', rawDamage);

      if (isPlayerTurn) {
        const newHp = Math.max(0, currentOpponentHp - rawDamage);
        setCurrentOpponentHp(newHp);
        addLog(`あなたの「${attackerWord}」で${opponentCharacter.name}に${rawDamage}ダメージ！`);
        if (newHp <= 0) {
          setIsGameOver(true);
          addLog('あなたの勝利！');
          return;
        }
      } else {
        const newHp = Math.max(0, currentMyHp - rawDamage);
        setCurrentMyHp(newHp);
        addLog(`${opponentCharacter.name}の「${attackerWord}」で${rawDamage}ダメージを受けた！`);
        if (newHp <= 0) {
          setIsGameOver(true);
          addLog('あなたの敗北...');
          return;
        }
      }
    }

    advanceTurn();
  }

  // 時間切れ専用処理（ダメージ計算を一切通さない）
  function forfeitTurn() {
    if (isGameOver) return;
    const whoName = isPlayerTurn ? 'あなた' : opponentCharacter.name;
    addLog(`${whoName}は時間切れ！ 何も打てなかった...`);
    advanceTurn();
  }

  // エフェクトは1.2秒後に自動で消す
  useEffect(() => {
    if (!effect) return;
    const timer = setTimeout(() => setEffect(null), 1200);
    return () => clearTimeout(timer);
  }, [effect]);

  // 相手のターンになったら、ダミーとして少し待ってから自動で単語を送信する
  useEffect(() => {
    if (isGameOver || isPlayerTurn) return;

    const timer = setTimeout(() => {
      const dummyLength = Math.floor(Math.random() * 5) + 1;
      const dummyWord = 'し'.repeat(dummyLength);
      resolveTurn(dummyWord);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, turnId, isGameOver]);

  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-2xl mx-auto">
      <CounterEffect effect={effect} />
      <div className="flex-1 overflow-y-auto flex flex-col items-center gap-6 p-6">
        <div className="w-full flex justify-between gap-4">
          <HpBar name={myCharacter.name} currentHp={currentMyHp} maxHp={myCharacter.maxHp} />
          <HpBar name={opponentCharacter.name} currentHp={currentOpponentHp} maxHp={opponentCharacter.maxHp} />
        </div>

        <p className="text-sm text-gray-400">
          {isPlayerTurn ? 'あなたのターン' : `${opponentCharacter.name}のターン`}
        </p>

        {!isGameOver && <TurnTimer turnId={turnId} onTimeUp={forfeitTurn} />}

        <div className="w-full h-40 overflow-y-auto bg-gray-800 rounded-lg p-3 text-sm flex flex-col gap-1">
          {log.map((entry, index) => (
            <p key={index}>{entry}</p>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-gray-900 p-4">
        {!isGameOver ? (
          isPlayerTurn ? (
            <WordInputField onSubmit={resolveTurn} />
          ) : (
            <p className="text-center text-gray-400 py-3">相手のターンです...</p>
          )
        ) : (
          <button
            onClick={() => changeScreen('title')}
            className="w-full px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500"
          >
            タイトルへ戻る
          </button>
        )}
      </div>
    </div>
  );
}