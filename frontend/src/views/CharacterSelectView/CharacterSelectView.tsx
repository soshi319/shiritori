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
    setShowDescription(false);

    const timer = setTimeout(() => {
      setShowDescription(true);
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
      goToNext();
    } else if (diff < -50) {
      goToPrev();
    }

    setTouchStartX(null);
  }

  const selectedCharacter = characters[selectedIndex];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center gap-8 p-8 w-full bg-stone-100 text-stone-800 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="text-3xl font-extrabold tracking-normal text-stone-800">キャラクター選択</h1>

      <div className="relative w-full max-w-md overflow-hidden">
        <button
          onClick={goToPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-xl px-4 py-3 bg-white/80 border border-stone-200 text-stone-700 rounded-full hover:bg-white transition-colors shadow-sm"
        >
          ◀
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-xl px-4 py-3 bg-white/80 border border-stone-200 text-stone-700 rounded-full hover:bg-white transition-colors shadow-sm"
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
              <div className="w-56 h-56 flex items-center justify-center">
                <img
                  src={`/images/${character.id}.png`}
                  alt={character.name}
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">{character.name}</h2>
              <p className="text-sm text-stone-500">
                {character.job} ／ {character.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`max-w-md text-center transition-opacity duration-500 flex flex-col gap-1 ${
          showDescription ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-sm text-stone-600 mb-2">{selectedCharacter.flavorText}</p>
        <p className="text-sm font-semibold text-stone-700">HP: {selectedCharacter.maxHp}</p>
        <p className="text-sm font-medium text-stone-600">
          固有スキル「{selectedCharacter.skillName}」: {selectedCharacter.skillDescription}
        </p>
      </div>

      <button
        onClick={() => {
          onConfirmCharacter(selectedCharacter.id);
          changeScreen('game');
        }}
        className="px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-center bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-sm transition-all duration-200"
      >
        このキャラクターで対戦する
      </button>
    </div>
  );
}