import type { Card, Grid } from '@kurone-kito/oneiron-core';
import { createEmptyGrid } from '@kurone-kito/oneiron-core';
import { GameGrid } from './components/Grid.tsx';
import { Hand } from './components/Hand.tsx';

const demoCards: Card[] = [
  { kind: 'element', element: 'fire', value: 7 },
  { kind: 'element', element: 'water', value: 3 },
  { kind: 'joker' },
];

const demoGrid: Grid = (() => {
  const g = createEmptyGrid();
  return {
    ...g,
    fire: {
      ...g.fire,
      water: [
        {
          teamNumber: 1,
          position: { x: 'fire', y: 'water' },
          facing: 'north',
          cards: [],
          players: [{ life: 3 }, { life: 4 }],
        },
      ],
    },
  } as Grid;
})();

export function App() {
  return (
    <main>
      <h1>⚔️ Dream Duels: The Battle for Oneiron</h1>
      <GameGrid grid={demoGrid} forbiddenCells={[]} currentPhase="battle" />
      <Hand cards={demoCards} label="Demo Hand (face up)" faceUp={true} />
    </main>
  );
}
