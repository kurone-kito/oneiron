# @kurone-kito/oneiron-web

> **[日本語版 README はこちら](./README.ja.md)**

Web-based simulator for **Dream Duels: The Battle for Oneiron**.

Built with [Vite](https://vite.dev/) + [Solid.js](https://www.solidjs.com/).
SolidStart's full meta-framework was not chosen because the simulator
is a single-page client-only application with no SSR, API routes, or
SEO requirements. Solid.js's fine-grained reactivity is well-suited to
game state management.

## Status

Scaffold only — UI is added by follow-up issues.

## Development

```sh
pnpm --filter @kurone-kito/oneiron-web run dev
```

## Build

```sh
# Default — assets rooted at "/" (good for `pnpm preview` and any
# deployment that owns the domain root).
pnpm --filter @kurone-kito/oneiron-web run build

# GitHub Pages — assets rooted at "/oneiron/" so they resolve under
# https://kurone-kito.github.io/oneiron/. The deploy workflow
# (issue #161) sets this automatically.
WEB_BASE=/oneiron/ pnpm --filter @kurone-kito/oneiron-web run build
```

`WEB_BASE` is read by [`vite.config.ts`](./vite.config.ts) and
applied to Vite's [`base`](https://vite.dev/config/shared-options.html#base)
plus the PWA service-worker registration scope. The hand-written
[`public/manifest.webmanifest`](./public/manifest.webmanifest)
uses manifest-relative URLs (`./icon-192.png` etc.) so it adapts
to any base path without a build-time rewrite.

## Deployment

The simulator is published to GitHub Pages at
[`https://kurone-kito.github.io/oneiron/`](https://kurone-kito.github.io/oneiron/).

- **Automatic**: every push to `main` triggers
  [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml),
  which builds with `WEB_BASE=/oneiron/` and publishes the
  `packages/web/dist/` artifact via the official Pages actions
  (`actions/configure-pages` + `upload-pages-artifact` +
  `deploy-pages`).
- **Manual re-run**:

  ```sh
  gh workflow run "Deploy web simulator to GitHub Pages"
  ```

  Or use the **Run workflow** button on
  [the Actions tab](https://github.com/kurone-kito/oneiron/actions/workflows/deploy.yml).

The repository's Pages source must remain **GitHub Actions**
(see [Settings → Pages](https://github.com/kurone-kito/oneiron/settings/pages));
switching back to a branch source disables this workflow.

## Installing as a mobile app

A built-and-served instance of this package can be added to a
mobile home screen via the browser's standard PWA install
flow:

- **iOS Safari**: tap the Share button, then
  **Add to Home Screen**.
- **Android Chrome / Edge**: tap the overflow menu (⋮), then
  **Install app** or **Add to Home Screen**.

The app launches in standalone mode using the icon and name
declared in
[`public/manifest.webmanifest`](./public/manifest.webmanifest).
Service-worker-based offline support lands separately; see
roadmap [#145](../../).

## License

[MIT](../../LICENSE)
