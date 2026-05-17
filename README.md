# ⚔️ Dream Duels: The Battle for Oneiron

> **[日本語版 README はこちら](./README.ja.md)**

A table-talk battle royale card game engine and web simulator.

## Overview

Dream Duels is a battle royale card game for 6–12 players (2–20
theoretically) plus one Game Master. Players fight on a 3×3 elemental
grid using Fire, Water, and Wood cards in a rock-paper-scissors
relationship, across four repeating phases: Battle, Forbidden Area,
Movement, and Revival.

The last team standing wins.

## Repository structure

This monorepo (pnpm workspaces) will contain:

| Package | Description |
| --- | --- |
| `packages/core` | `@kurone-kito/oneiron-core` — rule engine (npm-publishable) |
| `packages/web` | `@kurone-kito/oneiron-web` — web-based simulator |

> Packages are scaffolded by follow-up issues. This commit establishes
> repository identity only.

## Game rules

- [Japanese / 日本語](./docs/rules.ja.md) — canonical
- [English](./docs/rules.md) — translation pending

## Development

### Requirements

- Node.js: `^22.22.2 || >=24`
- pnpm (via corepack)

### Setup

```sh
corepack enable
pnpm install
```

### Linting

```sh
pnpm run lint
pnpm run lint:fix
```

### Testing

```sh
pnpm run test
```

Currently an alias for `pnpm run lint`. A real test runner (Vitest) is
set up by a follow-up issue.

### Cleaning

```sh
pnpm run clean
```

## Contributing

Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md).

## License

[MIT](./LICENSE)
