import { useState } from 'react';
import { TitleView } from './views/TitleView';
import { ModeSelectView } from './views/ModeSelectView';
import { CharacterSelectView } from './views/CharacterSelectView';
import { GameView } from './views/GameView';
import type { Screen } from './types/screen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center">
      {currentScreen === 'title' && (
        <TitleView changeScreen={setCurrentScreen} />
      )}

      {currentScreen === 'modeSelect' && (
        <ModeSelectView changeScreen={setCurrentScreen} />
      )}

      {currentScreen === 'characterSelect' && (
        <CharacterSelectView changeScreen={setCurrentScreen} />
      )}

      {currentScreen === 'game' && (
        <GameView changeScreen={setCurrentScreen} />
      )}
    </div>
  );
}

export default App;