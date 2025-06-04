# 📄 PNPM project template

## Features

- PNPM
- TypeScript
- Biome
- Commitlint with Husky
- Visual Studio Code / Vim ready
- CI configurations
  - CodeRabbit
  - Dependabot
  - GitHub Actions

## how to use this template

You can create a new project by using `degit` or the “Use this template”
button on GitHub.

```sh
npx degit kurone-kito/pnpm-project-template my-project
cd my-project
pnpm install
```

After generating the project, update `package.json` fields such as `name`
and `author` so that they reflect your project information.

### Example settings

#### Monorepo

Add package directories to `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
```

#### Non-monorepo

Remove `pnpm-workspace.yaml` if you do not need workspace support.

## System Requirements

- Node.js: Any of the following versions
  - Iron LTS (`^20.11.x`)
  - Jod LTS or latest (`>=22.x.x`)

Note that this template includes `.node-version`, `.nvmrc`, and
`.tool-versions` files with specific Node.js versions. These files
currently list `20.19.2`, so update them and this section as needed when
you start a new project.

## Install the dependencies

```sh
corepack enable
pnpm install
```

## Linting

```sh
pnpm run lint
pnpm run lint:fix # Lint and auto-fix
```

## Testing

```sh
pnpm run test
```

Currently, the command works as an alias for the `pnpm run lint` command.
Set up your own testing framework and replace this script as needed.

## Cleaning

```sh
pnpm run clean
```

## Rules for Development

Welcome to contribute to this repository! For more details,
please refer to [CONTRIBUTING.md](.github/CONTRIBUTING.md).

Introduce commit message validation at commit time.
The “**[Conventional Commits](https://www.conventionalcommits.org/ja/)**”
rule is applied to discourage committing messages that violate conventions.

## LICENSE

MIT
