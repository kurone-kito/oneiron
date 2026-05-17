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

## License

[MIT](../../LICENSE)
