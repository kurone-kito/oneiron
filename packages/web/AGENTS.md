# Guidelines for AI Agents — @kurone-kito/oneiron-web

This package is the **web-based simulator** for Dream Duels.

## Framework

Vite + Solid.js (plain SPA, not SolidStart). Use Solid.js signals and
stores for game state. TSX syntax is used for components.

## Planned UI components (wave-2 issues)

- `Grid`: 3×3 elemental grid rendering with coordinate labels
- `TeamToken`: number token + life token display per team
- `Hand`: card hand display for each player
- `PhaseIndicator`: current phase (Battle / Forbidden / Movement /
  Revival) and round counter
- `TurnLog`: scrollable history of events
- `GMPanel`: GM controls (draw forbidden area, draw movement attribute)

## Rules

- Import game-domain types from `@kurone-kito/oneiron-core`
- This package is client-side only — no server-side code
- Run `pnpm --filter @kurone-kito/oneiron-web run build` to verify
  Vite build succeeds
