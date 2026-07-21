import { useState } from 'react';
import { TitleView } from './views/TitleView';
import { ModeSelectView } from './views/ModeSelectView';
import { CharacterSelectView } from './views/CharacterSelectView';
import { GameView } from './views/GameView';
import { RuleView } from './views/RuleView';
import { PracticeView } from './views/PracticeView';
import { CpuView } from './views/CpuView';
import { RankingView } from './views/RankingView';
import { Modal } from './components/common/Modal';
import type { Screen } from './types/screen';
import { getPlayerName } from './utils/playerName';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isCpuMode, setIsCpuMode] = useState<boolean>(false);
  // ★タイトル画面でいつでも変更できるプレイヤー名。初期値はlocalStorageから復元する
  const [playerName, setPlayerName] = useState<string>(() => getPlayerName());

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-950 font-sans flex items-center justify-center">
      {currentScreen === 'title' && (
        <TitleView
          changeScreen={setCurrentScreen}
          onOpenRules={() => setIsRuleModalOpen(true)}
          playerName={playerName}
          onChangePlayerName={setPlayerName}
        />
      )}

      {currentScreen === 'modeSelect' && (
        <ModeSelectView changeScreen={setCurrentScreen} setCpuMode={setIsCpuMode} />
      )}

      {currentScreen === 'characterSelect' && (
        <CharacterSelectView
          changeScreen={setCurrentScreen}
          onConfirmCharacter={setSelectedCharacterId}
        />
      )}

      {currentScreen === 'game' && selectedCharacterId && (
        isCpuMode ? (
          <CpuView
            changeScreen={setCurrentScreen}
            selectedCharId={selectedCharacterId}
            playerName={playerName}
          />
        ) : (
          <GameView
            changeScreen={setCurrentScreen}
            myCharacterId={selectedCharacterId}
            playerName={playerName}
          />
        )
      )}

      {currentScreen === 'practice' && (
        <PracticeView
          changeScreen={setCurrentScreen}
        />
      )}

      {currentScreen === 'ranking' && (
        <RankingView
          changeScreen={setCurrentScreen}
          playerName={playerName}
        />
      )}

      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)}>
        <RuleView />
      </Modal>
    </div>
  );
}

export default App;
