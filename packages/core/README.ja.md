# @kurone-kito/oneiron-core

> **[English README is here](./README.md)**

**Dream Duels: The Battle for Oneiron** のコアルールエンジンパッケージ。

属性カード（火・水・木）、三すくみ解決、3×3 グリッド座標、ライフ/番号トークン、
4 フェーズ（バトル/禁止エリア/移動/復活）のラウンドマシンをモデル化します。

UI は含みません。Web シミュレーターは `@kurone-kito/oneiron-web` を参照。

## 状態

スキャフォールドのみ — ルールエンジンのコードは後続 issue で追加します。

## ビルドと利用

`@kurone-kito/oneiron-core` はコンパイル済みの JavaScript
（`dist/`）として公開されます。ワークスペース内の兄弟パッケージ
（`@kurone-kito/oneiron-web`、`@kurone-kito/oneiron-cli`）と外部
`node_modules` 経由の利用者は、いずれも同じ `exports` マップを通って
`dist/` を参照します。

- **ビルド**:
  `pnpm --filter @kurone-kito/oneiron-core run build`
  （`tsc -p tsconfig.build.json` を実行し、`dist/` へ出力）。
- **`prepare` フック**: `pnpm install` 実行時に自動でビルドされるため、
  依存パッケージは常に `dist/` から import できます。
- **コアの開発時**: ソース変更後はビルドを再実行して `dist/` を更新
  （`pnpm -F @kurone-kito/oneiron-core run build`）。
  `packages/core` 内の Vitest テストは相対パスでソースを直接読むため、
  再ビルドを必要としません。
- **クリーン**: `pnpm -F @kurone-kito/oneiron-core run clean` で
  `dist/` を削除。

`exports` の解決先はランタイムが `./dist/index.js`、型情報が
`./dist/index.d.ts` です。ソースマップ用に `./src/` も `files` に含めて
います。

## ライセンス

[MIT](../../LICENSE)
