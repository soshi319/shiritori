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
import type { ServerMessage, ClientMessage, PlayerState, RatingChange } from 'shared/types/messageTypes';
import { getRequiredNextStart, normalizeWordForComparison } from 'shared/logic/shiritoriValidator';
import { WS_URL } from 'shared/config/serverConfig'; // ★サーバー接続先を設定ファイルから読み込む
import { CharacterSkillPopover } from '../../components/game/CharacterSkillPopover';

// 再レンダリング時にタイマーが壊れるのを防ぐため、ダミー関数をコンポーネント外に固定定義
const handleTimeUpDummy = () => {};

type GameViewProps = {
  changeScreen: (screen: Screen) => void;
  myCharacterId: string;
  playerName: string;
};

export function GameView({ changeScreen, myCharacterId, playerName }: GameViewProps) {
  const [status, setStatus] = useState<'CONNECTING' | 'WAITING' | 'ANNOUNCING' | 'PLAYING' | 'GAME_OVER'>('CONNECTING');
  const statusRef = useRef(status);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [myState, setMyState] = useState<PlayerState | null>(null);
  const [opponentState, setOpponentState] = useState<PlayerState | null>(null);
  const myStateRef = useRef<PlayerState | null>(null);
  const opponentStateRef = useRef<PlayerState | null>(null);

  const [currentWord, setCurrentWord] = useState('');
  const [activePlayerId, setActivePlayerId] = useState('');
  const [turnId, setTurnId] = useState(0);
  const [turnDuration, setTurnDuration] = useState(40);
  const [effect, setEffect] = useState<EffectData | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<{ winner: RatingChange; loser: RatingChange } | null>(null);

  const [isWaitingSync, setIsWaitingSync] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [comboBurst, setComboBurst] = useState<number | null>(null);
  const [poisonBurst, setPoisonBurst] = useState(0);

  const myCharacter = characters.find((c) => c.id === myCharacterId)!;
  const opponentCharacter = characters.find((c) => c.id === opponentState?.characterId) || characters[0];
  const [openSkillFor, setOpenSkillFor] = useState<'me' | 'opponent' | null>(null);

  type CharAnimState = 'IDLE' | 'ATTACK' | 'REFLECT_BACK' | 'HIT_SHAKE';

  // 自分と相手の演出状態を管理するState
  const [myAnim, setMyAnim] = useState<CharAnimState>('IDLE');
  const [opponentAnim, setOpponentAnim] = useState<CharAnimState>('IDLE');

  const activePlayerIdRef = useRef('');

  // 先攻/後攻の発表演出が終わったら、自動的に対戦画面へ切り替える
  useEffect(() => {
    if (status !== 'ANNOUNCING') return;

    const timer = setTimeout(() => {
      setStatus('PLAYING');
    }, 2500);

    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    activePlayerIdRef.current = activePlayerId;
  }, [activePlayerId]);

  // statusが変わるたびに、statusRefの中身も最新に更新しておく
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // myState / opponentState が変わるたびに、refの中身も最新に更新しておく
  useEffect(() => {
    myStateRef.current = myState;
  }, [myState]);

  useEffect(() => {
    opponentStateRef.current = opponentState;
  }, [opponentState]);

  useEffect(() => {
    if (currentWord) {
      setHistory((prev) => {
        if (prev.includes(currentWord)) return prev;
        return [...prev, currentWord];
      });
    }
  }, [currentWord]);

  // 毒の演出は1.6秒後に自動で消す
  useEffect(() => {
    if (poisonBurst === 0) return;
    const timer = setTimeout(() => setPoisonBurst(0), 1600);
    return () => clearTimeout(timer);
  }, [poisonBurst]);

  // コンボの演出は1.2秒後に自動で消す
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

  // WebSocket接続（この中ではrefを経由して常に最新の状態を参照する）
  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    let pingInterval: number;

    socket.onopen = () => {
      setStatus('WAITING');
      const joinMsg: ClientMessage = {
        type: 'JOIN_ROOM',
        payload: { playerName, characterId: myCharacterId },
      };
      socket.send(JSON.stringify(joinMsg));

      // ★【追加】15秒ごとにPINGを送信してDeno Deployのタイムアウトを防ぐ
      pingInterval = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'PING' }));
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      if(msg.type===('PONG' as any)) return;

      switch (msg.type) {
        case 'MATCHED': {
          setMyState(msg.payload.me);
          setOpponentState(msg.payload.opponent);
          setCurrentWord(msg.payload.initialWord);
          setActivePlayerId(msg.payload.firstPlayerId);
          setStatus('ANNOUNCING');
          setLog(['対戦相手が見つかりました！バトルスタート！']);
          break;
        }

        case 'TURN_START': {
          setTurnId(msg.payload.turnId);
          setActivePlayerId(msg.payload.activePlayerId);
          setCurrentWord(msg.payload.previousWord);
          setTurnDuration(msg.payload.duration);
          setIsWaitingSync(false);
          setInputError(null);
          break;
        }

        case 'WORD_REJECTED': {
          setInputError(msg.payload.message);
          break;
        }

        case 'TURN_RESULT': {
          const prevMyCombo = myStateRef.current?.comboCount ?? 0;
          const prevOpponentCombo = opponentStateRef.current?.comboCount ?? 0;
          const prevMyPoisonStacks = myStateRef.current?.poisonStacks ?? 0;
          const prevOpponentPoisonStacks = opponentStateRef.current?.poisonStacks ?? 0;

          const isAttackerMe = myStateRef.current?.id === activePlayerIdRef.current;

          setMyState(msg.payload.myState);
          setOpponentState(msg.payload.opponentState);
          setCurrentWord(msg.payload.word);
          setIsWaitingSync(false);

          if (msg.payload.effect) {
            setEffect(msg.payload.effect);

            // 【追加】ヒット/反射に応じて、攻撃側・防御側のアニメーションを発火させる
            const { type } = msg.payload.effect;

            if (type === 'hit') {
              // 通常ヒット：攻撃した側が前に出て、受けた側が揺れる
              if (isAttackerMe) {
                setMyAnim('ATTACK');
                setOpponentAnim('HIT_SHAKE');
              } else {
                setOpponentAnim('ATTACK');
                setMyAnim('HIT_SHAKE');
              }
            } else {
              // 反射：攻撃側自身が後ろに下がりつつダメージを受ける
              if (isAttackerMe) {
                setMyAnim('REFLECT_BACK');
              } else {
                setOpponentAnim('REFLECT_BACK');
              }
            }
          }

          // 【変更】誰が・何をされたのかが分かるログに
          if (msg.payload.errorMessage) {
            const who = isAttackerMe ? 'あなた' : '相手';
            setLog((prev) => [`${who}の「${msg.payload.word}」は無効: ${msg.payload.errorMessage}`, ...prev]);
          } else if (msg.payload.effect) {
            const { type, damage } = msg.payload.effect;

            if (type === 'hit') {
              const message = isAttackerMe
                ? `あなたの「${msg.payload.word}」で相手に${damage}ダメージ！`
                : `相手の「${msg.payload.word}」であなたが${damage}ダメージを受けた！`;
              setLog((prev) => [message, ...prev]);
            } else {
              // reflect：ダメージは攻撃側自身に返る
              const message = isAttackerMe
                ? `相手に読まれた！あなたの「${msg.payload.word}」が反射され、自分に${damage}ダメージ！`
                : `反射成功！相手の「${msg.payload.word}」を跳ね返し、相手に${damage}ダメージ！`;
              setLog((prev) => [message, ...prev]);
            }
          } else {
            setLog((prev) => [`「${msg.payload.word}」！`, ...prev]);
          }

          // コンボ演出（変更なし）
          const newMyCombo = msg.payload.myState.comboCount;
          const newOpponentCombo = msg.payload.opponentState.comboCount;

          if (newMyCombo > prevMyCombo && newMyCombo >= 2) {
            setComboBurst(newMyCombo);
          } else if (newOpponentCombo > prevOpponentCombo && newOpponentCombo >= 2) {
            setComboBurst(newOpponentCombo);
          }

          // 【変更】毒の付与を、誰に付与されたか分かるログに
          const myNewlyPoisoned = msg.payload.myState.poisonStacks > prevMyPoisonStacks;
          const opponentNewlyPoisoned = msg.payload.opponentState.poisonStacks > prevOpponentPoisonStacks;

          if (myNewlyPoisoned || opponentNewlyPoisoned) {
            setPoisonBurst((prev) => prev + 1);
            setLog((prev) => [
              myNewlyPoisoned ? '毒を受けた…体が重い' : '相手に毒を付与した！',
              ...prev,
            ]);
          }

          // 【修正】相手側の毒ダメージも表示するよう追加（以前は自分の分しか出ていませんでした）
          if (msg.payload.poisonDamage) {
            if (msg.payload.poisonDamage.myDamage > 0) {
              setLog((prev) => [`毒の効果で${msg.payload.poisonDamage?.myDamage}ダメージを受けた…`, ...prev]);
            }
            if (msg.payload.poisonDamage.opponentDamage > 0) {
              setLog((prev) => [`相手は毒の効果で${msg.payload.poisonDamage?.opponentDamage}ダメージを受けている！`, ...prev]);
            }
          }
          break;
        }

        case 'WAIT_OPPONENT': {
          setIsWaitingSync(true);
          break;
        }

        case 'GAME_OVER': {
          setWinnerId(msg.payload.winnerId);
          setGameOverReason(msg.payload.reason);
          setRatings(msg.payload.ratings ?? null);
          setStatus('GAME_OVER');
          break;
        }
      }
    };

    socket.onclose = () => {
      if (statusRef.current !== 'GAME_OVER') {
        setLog((prev) => ['サーバーから切断されました', ...prev]);
        setStatus('GAME_OVER');
      }
    };

    setWs(socket);
    return () => {
      clearInterval(pingInterval);
      socket.close();
    };
  }, [myCharacterId]);

  function handleSubmitWord(word: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const requiredStart = getRequiredNextStart(currentWord);
    const hiraWord = normalizeWordForComparison(word);

    if (!hiraWord.startsWith(requiredStart)) {
      setInputError(`「${requiredStart}」から始まる言葉を入力してください！`);
      return;
    }

    setInputError(null);
    const msg: ClientMessage = { type: 'SUBMIT_WORD', payload: { word } };
    ws.send(JSON.stringify(msg));
  }

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

  const isMyTurn = myState && activePlayerId === myState.id;
  const isGameOver = status === 'GAME_OVER';

  const requiredStartNow = getRequiredNextStart(currentWord);

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
          <TurnTimer turnId={turnId} duration={turnDuration} onTimeUp={handleTimeUpDummy} />
        )}

        <div className="w-full h-40 overflow-y-auto bg-white/60 rounded-xl p-3 text-sm flex flex-col gap-1 border border-zinc-300/50 shadow-sm">
          {log.map((entry, index) => (
            <p key={index} className={index === 0 ? 'text-zinc-900 font-bold' : 'text-zinc-600'}>{entry}</p>
          ))}
        </div>
      </div>

      {/* 【追加】必殺技の発動条件を、ログの下に大きく目立たせて表示 */}
      {!isGameOver && isMyTurn && myState && myState.hp <= 30 && (
        <div className="w-full text-center animate-pulse">
          {myState.characterId === 'A' ? (
            <p className="text-2xl font-black text-red-700 tracking-wide drop-shadow-sm">
              🗡️ 「ん」で終わる4文字で「一閃」発動！
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
                disabled={false} 
                isMyTurn={isMyTurn ?? false} 
                requiredStart={requiredStartNow} 
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-2xl font-black text-zinc-900 tracking-wide">
              {myState?.id === winnerId ? '🎉 あなたの勝利！' : '💀 あなたの敗北...'}
            </h2>
            <p className="text-sm text-zinc-700 font-medium">
              決着の理由:{' '}
              {gameOverReason === 'hp_zero' ? 'HPが0になった' :
               gameOverReason === 'time_up' ? '時間切れ' :
               gameOverReason === 'bakudan_failed' ? 'ばくだん自爆（即死）' :
               gameOverReason === 'poison' ? '毒によるダメージ' : '通信切断'}
            </p>
            {ratings && myState && (() => {
              const myRating = myState.id === winnerId ? ratings.winner : ratings.loser;
              const isPlus = myRating.delta > 0;
              return (
                <p className="text-base font-bold text-zinc-900">
                  レート: {myRating.before} → {myRating.after}{' '}
                  <span className={isPlus ? 'text-emerald-600' : myRating.delta < 0 ? 'text-red-600' : 'text-zinc-500'}>
                    ({isPlus ? '+' : ''}{myRating.delta})
                  </span>
                </p>
              );
            })()}
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