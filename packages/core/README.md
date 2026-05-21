# @kurone-kito/oneiron-core

> **[日本語版 README はこちら](./README.ja.md)**

Core rule engine for **Dream Duels: The Battle for Oneiron**.

This package models the game's domain: elemental cards (Fire / Water /
Wood), the rock-paper-scissors resolution, 3×3 grid coordinates, life
and number tokens, and the four-phase round machine (Battle / Forbidden
Area / Movement / Revival).

It does **not** include any UI; see `@kurone-kito/oneiron-web` for the
web-based simulator.

## Status

Scaffold only — rule-engine code is added by follow-up issues.

## Build & consumption

`@kurone-kito/oneiron-core` is published as **compiled JavaScript**
(`dist/`). Workspace siblings (`@kurone-kito/oneiron-web`,
`@kurone-kito/oneiron-cli`) and external `node_modules` consumers
both go through the same `exports` map.

- **Build**: `pnpm --filter @kurone-kito/oneiron-core run build`
  (runs `tsc -p tsconfig.build.json` → emits to `dist/`).
- **`prepare` hook**: `pnpm install` automatically builds the
  package, so downstream packages can always import from `dist`.
- **Active core development**: re-run the build after editing
  source so `dist/` reflects your changes
  (`pnpm -F @kurone-kito/oneiron-core run build`). Vitest tests
  inside `packages/core` use the source directly via relative
  paths, so they do not require a fresh build.
- **Clean**: `pnpm -F @kurone-kito/oneiron-core run clean`
  removes `dist/`.

`exports` resolves to `./dist/index.js` (runtime) and
`./dist/index.d.ts` (types). The source tree under `./src/` is
included in `files` for source-map debugging.

## License

[MIT](../../LICENSE)
