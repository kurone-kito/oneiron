# Guidelines for AI Agents — @kurone-kito/oneiron-core

This package is the **rule engine** for Dream Duels. It is purely
TypeScript domain logic with no UI code.

## Domain model (planned)

- `Element`: `fire | water | wood` — three-way rock-paper-scissors
- `ElementCard`: element + numeric value (1–13) + quantity A
- `JokerCard`: beats any element card unconditionally
- `Token`: life token (max 4 per player) or number token (1–10)
- `Grid`: 3×3 coordinate system with elemental-card axes
- `Team`: 1–2 players sharing a coordinate, a facing direction, and a hand
- `Phase`: `battle | forbidden | movement | revival`
- Variables A–E: tuning parameters (values TBD by game-design issues)

## Rules

Follow the root-level AI guideline files. Additionally:

- This package is ESM-only.
- Keep exports minimal — expose only what the web simulator needs.
- Run `pnpm --filter @kurone-kito/oneiron-core run typecheck` to verify
  TypeScript correctness for this package only.
