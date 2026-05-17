import type { Card } from '@kurone-kito/oneiron-core';
import { Hand } from './components/Hand.tsx';

const demoCards: Card[] = [
  { kind: 'element', element: 'fire', value: 7 },
  { kind: 'element', element: 'water', value: 3 },
  { kind: 'joker' },
];

export function App() {
  return (
    <main>
      <h1>⚔️ Dream Duels: The Battle for Oneiron</h1>
      <Hand cards={demoCards} label="Demo Hand (face up)" faceUp={true} />
      <Hand cards={demoCards} label="Demo Hand (face down)" faceUp={false} />
    </main>
  );
}
