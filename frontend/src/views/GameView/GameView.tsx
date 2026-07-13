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
import type { ServerMessage, ClientMessage, PlayerState } from 'shared/types/messageTypes';
import { getRequiredNextStart, normalizeWordForComparison } from 'shared/logic/shiritoriValidator';

// 再レンダリング時にタイマーが壊れるのを防ぐため、ダミー関数をコンポーネント外に固定定義
const handleTimeUpDummy = () => {};

type GameViewProps = {
  changeScreen: (screen: Screen) => void;
  myCharacterId: string;
};

export function GameView({ changeScreen, myCharacterId }: GameViewProps) {
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

  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const [isWaitingSync, setIsWaitingSync] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [comboBurst, setComboBurst] = useState<number | null>(null);
  const [poisonBurst, setPoisonBurst] = useState(0);

  const myCharacter = characters.find((c) => c.id === myCharacterId)!;

  // 先攻/後攻の発表演出が終わったら、自動的に対戦画面へ切り替える
  useEffect(() => {
    if (status !== 'ANNOUNCING') return;

    const timer = setTimeout(() => {
      setStatus('PLAYING');
    }, 2500);

    return () => clearTimeout(timer);
  }, [status]);

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

  // WebSocket接続（この中ではrefを経由して常に最新の状態を参照する）
  useEffect(() => {
    const socket = new WebSocket("wss://shiritori.soshi319.deno.net/");

    socket.onopen = () => {
      setStatus('WAITING');
      const joinMsg: ClientMessage = {
        type: 'JOIN_ROOM',
        payload: { playerName: 'プレイヤー', characterId: myCharacterId },
      };
      socket.send(JSON.stringify(joinMsg));
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;

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
          // refを経由して「今の本当の最新値」を読む（stale closure対策）
          const prevMyCombo = myStateRef.current?.comboCount ?? 0;
          const prevOpponentCombo = opponentStateRef.current?.comboCount ?? 0;
          const prevMyPoisonStacks = myStateRef.current?.poisonStacks ?? 0;
          const prevOpponentPoisonStacks = opponentStateRef.current?.poisonStacks ?? 0;

          setMyState(msg.payload.myState);
          setOpponentState(msg.payload.opponentState);
          setCurrentWord(msg.payload.word);
          setIsWaitingSync(false);

          if (msg.payload.effect) setEffect(msg.payload.effect);

          if (msg.payload.errorMessage) {
            setLog((prev) => [`判定エラー: ${msg.payload.errorMessage}`, ...prev]);
          } else {
            setLog((prev) => [`「${msg.payload.word}」！`, ...prev]);
          }

          // コンボが2以上に伸びた瞬間だけ、演出を発火
          const newMyCombo = msg.payload.myState.comboCount;
          const newOpponentCombo = msg.payload.opponentState.comboCount;

          if (newMyCombo > prevMyCombo && newMyCombo >= 2) {
            setComboBurst(newMyCombo);
          } else if (newOpponentCombo > prevOpponentCombo && newOpponentCombo >= 2) {
            setComboBurst(newOpponentCombo);
          }

          // 毒スタックが増えた瞬間だけ、演出を発火
          const newlyPoisoned =
            msg.payload.myState.poisonStacks > prevMyPoisonStacks ||
            msg.payload.opponentState.poisonStacks > prevOpponentPoisonStacks;

          if (newlyPoisoned) {
            setPoisonBurst((prev) => prev + 1);
            setLog((prev) => ['毒を受けた…', ...prev]);
          }

          if (msg.payload.poisonDamage && msg.payload.poisonDamage.myDamage > 0) {
            setLog((prev) => [`毒ダメージを ${msg.payload.poisonDamage?.myDamage} 受けた！`, ...prev]);
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
    return () => socket.close();
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
    return <div className="flex h-screen items-center justify-center">サーバーに接続中...</div>;
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

  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-2xl mx-auto">
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
                  {opponentState.characterId === 'C' && <ComboIndicator comboCount={opponentState.comboCount} />}
                  <PoisonBadge poisonStacks={opponentState.poisonStacks} />
                </>
              }
            />
          )}
        </div>

        <div className="w-full flex justify-center items-end gap-5 sm:gap-36 mt-2 px-2">
          {myState && (
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
              <img
                src={`/images/${myState.characterId}.png`}
                alt="自分のキャラクター"
                className="w-full h-full object-contain -scale-x-100 drop-shadow-md"
              />
            </div>
          )}

          {opponentState && (
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
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
          <TurnTimer turnId={turnId} duration={turnDuration} onTimeUp={handleTimeUpDummy} />
        )}

        <div className="w-full h-40 overflow-y-auto bg-white/60 rounded-xl p-3 text-sm flex flex-col gap-1 border border-zinc-300/50 shadow-sm">
          {log.map((entry, index) => (
            <p key={index} className={index === 0 ? 'text-zinc-900 font-bold' : 'text-zinc-600'}>{entry}</p>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-zinc-300 p-4 border-t border-zinc-400/40">
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
              <WordInputField onSubmit={handleSubmitWord} disabled={false} isMyTurn={isMyTurn ?? false} />
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