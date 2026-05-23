# @kurone-kito/oneiron-web

> **[English README is here](./README.md)**

**Dream Duels: The Battle for Oneiron** の Web ベースシミュレーター。

[Vite](https://vite.dev/) + [Solid.js](https://www.solidjs.com/) で実装。
SolidStart のフルメタフレームワークは採用しませんでした。このシミュレーターは
SSR・API ルート・SEO が不要なシングルページアプリケーションであり、
Vite + Solid.js の組み合わせで十分です。Solid.js の細粒度リアクティビティは
ゲーム状態管理に適しています。

## 状態

スキャフォールドのみ — UI は後続 issue で追加します。

## 開発

```sh
pnpm --filter @kurone-kito/oneiron-web run dev
```

## ビルド

```sh
# デフォルト — asset URL はルート ("/") 起点
# (`pnpm preview` やドメイン直下の配信向け)。
pnpm --filter @kurone-kito/oneiron-web run build

# GitHub Pages 用 — asset URL を "/oneiron/" 配下にする。
# https://kurone-kito.github.io/oneiron/ で配信する想定。
# デプロイ workflow (issue #161) が自動でセットします。
WEB_BASE=/oneiron/ pnpm --filter @kurone-kito/oneiron-web run build
```

`WEB_BASE` は [`vite.config.ts`](./vite.config.ts) が読み取り、
Vite の [`base`](https://vite.dev/config/shared-options.html#base)
と PWA service worker の registration scope に伝播します。手書きの
[`public/manifest.webmanifest`](./public/manifest.webmanifest)
は manifest-relative URL (`./icon-192.png` 等) を使うため、
ベースパスが何であっても build 時の書き換え無しで追従します。

## モバイル端末へのインストール

ビルド・配信されたインスタンスは、ブラウザ標準の PWA インストール
フローからホーム画面に追加できます。

- **iOS Safari**: 共有ボタン → **ホーム画面に追加**
- **Android Chrome / Edge**: メニュー (⋮) →
  **アプリをインストール** または **ホーム画面に追加**

[`public/manifest.webmanifest`](./public/manifest.webmanifest)
で宣言したアイコンと名前で、スタンドアロンモードとして起動します。
Service worker によるオフライン対応は別 issue
（ロードマップ [#145](../../)）で扱います。

## ライセンス

[MIT](../../LICENSE)
