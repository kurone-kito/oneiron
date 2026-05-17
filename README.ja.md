# ⚔️ Dream Duels: The Battle for Oneiron

> **[English README is here](./README.md)**

テーブルトーク式バトルロワイヤルカードゲームエンジン＆Web シミュレーター

## 概要

Dream Duels は 6〜12 人（理論上 2〜20 人）＋ゲームマスター 1 人でプレイする
バトルロワイヤル形式のカードゲームです。プレイヤーは 3×3 のグリッドを舞台に、
火・水・木の三すくみ関係を持つ属性カードを使って戦います。
各ラウンドはバトル・禁止エリア・移動・復活の 4 フェーズで構成されます。

最後に生き残ったチームが勝利します。

## リポジトリ構成

pnpm workspace 形式の monorepo です:

| パッケージ | 説明 |
| --- | --- |
| `packages/core` | `@kurone-kito/oneiron-core` — ルールエンジン（npm 公開予定） |
| `packages/web` | `@kurone-kito/oneiron-web` — Web シミュレーター |

> パッケージは後続 issue でスキャフォールドします。この PR はリポジトリの
> アイデンティティ設定のみを行います。

## ゲームルール

- [日本語](./docs/rules.ja.md) — 正典
- [English](./docs/rules.md) — 翻訳待ち

## 開発

### 要件

- Node.js: `^22.22.2 || >=24`
- pnpm (corepack 経由)

### セットアップ

```sh
corepack enable
pnpm install
```

### Lint

```sh
pnpm run lint
pnpm run lint:fix
```

### テスト

```sh
pnpm run test
```

現在は `pnpm run lint` のエイリアスです。後続 issue で実際のテストランナー
(Vitest) を設定します。

### クリーンアップ

```sh
pnpm run clean
```

## コントリビューション

[CONTRIBUTING.md](.github/CONTRIBUTING.md) をご参照ください。

## ライセンス

[MIT](./LICENSE)
