import { useEffect, useState } from 'react';
import type { Screen } from '../../types/screen';
import { characters } from 'shared/data/characters';

type CharacterSelectViewProps = {
  changeScreen: (screen: Screen) => void;
  onConfirmCharacter: (characterId: string) => void;
};

export function CharacterSelectView({ changeScreen, onConfirmCharacter }: CharacterSelectViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);


  useEffect(() => {
    setShowDescription(false); // 一旦説明文を隠す

    const timer = setTimeout(() => {
      setShowDescription(true); // 0.4秒後に説明文を表示する
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedIndex]);

  function goToPrev() {
    setSelectedIndex((prev) => (prev === 0 ? characters.length - 1 : prev - 1));
  }

  function goToNext() {
    setSelectedIndex((prev) => (prev === characters.length - 1 ? 0 : prev + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      goToNext(); // 左にスワイプ → 次のキャラ
    } else if (diff < -50) {
      goToPrev(); // 右にスワイプ → 前のキャラ
    }

    setTouchStartX(null);
  }

  const selectedCharacter = characters[selectedIndex];

  return (
    <div className="flex flex-col items-center gap-8 p-8 w-full">
      <h1 className="text-3xl font-bold">キャラクター選択</h1>

      <div
        className="relative w-full max-w-md overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={goToPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-3xl px-3 py-2 bg-gray-800/70 rounded-full hover:bg-gray-700"
        >
          ◀
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-3xl px-3 py-2 bg-gray-800/70 rounded-full hover:bg-gray-700"
        >
          ▶
        </button>

        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
        >
          {characters.map((character) => (
            <div
              key={character.id}
              className="w-full flex-shrink-0 flex flex-col items-center gap-4 px-12"
            >
              <div className="w-40 h-40 rounded-full bg-indigo-800 flex items-center justify-center text-5xl font-bold">
                {character.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold">{character.name}</h2>
              <p className="text-sm text-gray-400">
                {character.job} ／ {character.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`max-w-md text-center transition-opacity duration-500 ${
          showDescription ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-sm text-gray-300 mb-2">{selectedCharacter.flavorText}</p>
        <p className="text-sm">HP: {selectedCharacter.maxHp}</p>
        <p className="text-sm text-indigo-300">
          固有スキル「{selectedCharacter.skillName}」: {selectedCharacter.skillDescription}
        </p>
      </div>

      <button
        onClick={() => {
          onConfirmCharacter(selectedCharacter.id);
          changeScreen('game');
        }}
        className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500"
      >
        このキャラクターで対戦する
      </button>
    </div>
  );
}