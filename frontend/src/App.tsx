import { useState } from 'react';
import { TitleView } from './views/TitleView';
import { ModeSelectView } from './views/ModeSelectView';
import { CharacterSelectView } from './views/CharacterSelectView';
import { GameView } from './views/GameView';
import { RuleView } from './views/RuleView';
import { PracticeView } from './views/PracticeView';
import { CpuView } from './views/CpuView';
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

      {/* 2. isCpuModeの有無によって表示するコンポーネントを出し分けます */}
      {currentScreen === 'game' && selectedCharacterId && (
        isCpuMode ? (
          <CpuView
            changeScreen={setCurrentScreen}
            selectedCharId={selectedCharacterId}
          />
        ) : (
          <GameView
            changeScreen={setCurrentScreen}
            myCharacterId={selectedCharacterId}
          />
        )
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