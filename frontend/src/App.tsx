import { useState } from 'react';
import { TitleView } from './views/TitleView';
import { ModeSelectView } from './views/ModeSelectView';
import { CharacterSelectView } from './views/CharacterSelectView';
import { GameView } from './views/GameView';
import { RuleView } from './views/RuleView';
import { PracticeView } from './views/PracticeView';
import { Modal } from './components/common/Modal';
import type { Screen } from './types/screen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isCpuMode, setIsCpuMode] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-950 font-sans flex items-center justify-center">
      {currentScreen === 'title' && (
        <TitleView
          changeScreen={setCurrentScreen}
          onOpenRules={() => setIsRuleModalOpen(true)}
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
        <GameView
          changeScreen={setCurrentScreen}
          myCharacterId={selectedCharacterId}
          isCpuMode={isCpuMode}
        />
      )}

      {currentScreen === 'practice' && (
        <PracticeView
          changeScreen={setCurrentScreen}
        />
      )}

      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)}>
        <RuleView />
      </Modal>
    </div>
  );
}

export default App;