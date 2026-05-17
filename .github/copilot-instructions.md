# Guidelines for AI Agents

This is **Dream Duels: The Battle for Oneiron** — a table-talk battle
royale card game implemented as a pnpm monorepo. The `packages/core`
workspace holds the npm-publishable rule engine; `packages/web` holds
the web-based simulator. The project is derived from
[`kurone-kito/pnpm-project-template`](https://github.com/kurone-kito/pnpm-project-template)
and has been customized for this game.

When contributing to this repository using AI agents, adhere to the
following guidelines to ensure high-quality contributions that align
with the project's standards and practices:

## Tooling priority and compatibility

This repository is intentionally optimized for GitHub Copilot CLI and
VS Code Copilot Chat because they are the primary tools used for
day-to-day work and benchmarking.

`AGENTS.md` and `CLAUDE.md` exist as lightweight compatibility entry
points for Codex and Claude Code. Keep this file as the canonical,
fully detailed guide unless benchmark results justify a more neutral
layout.

## Conversation

- The conversational language should match the user's language.
  For example, if the user speaks in Japanese, respond in Japanese.
- However, comments and documentation should be written in English unless
  there is a clear context otherwise.
- **Always** run `pnpm run lint:fix` after making any changes — no
  matter how small (including documentation typo fixes). Then verify
  with `pnpm run lint` before committing. This ensures consistent
  style even when the change itself seems trivial.
- If uncertainties, concerns, or other implementation issues arise while
  running in Agent mode, promptly switch to Plan mode and ask the user
  questions. In such cases, provide one or more recommended response
  options.
- Outside GitHub Copilot, interpret the `Agent mode` and `Plan mode`
  wording by intent: continue autonomously for low-risk work, but pause
  and ask a concise question when uncertainty or hidden risk makes the
  next step unsafe. When that pause is needed, provide one or more
  recommended response options.

## Boundaries

### Always do

- Run `pnpm run lint:fix` after every change, then verify with
  `pnpm run lint`
- Follow Conventional Commits for all commits
- Use LF line endings, 2-space indentation, and a final newline
- Keep commits atomic — one logical change per commit
- Write comments and documentation in English

### Ask first

- Adding or removing dependencies
- Changing the project architecture or directory structure
- Modifying CI/CD workflows (`.github/workflows/`)
- Altering shared configuration packages (`@kurone-kito/*-config`)
- Making changes that affect all workspace packages

### Never do

- Commit secrets, credentials, API keys, or tokens into source code
- Modify community documents (`CODE_OF_CONDUCT*`, `CONTRIBUTING*`)
  without explicit approval
- Disable or bypass linter rules without justification
- Accept AI-generated code without reviewing it for correctness
  and security
- Introduce breaking changes without a `BREAKING CHANGE` footer

## Commit rules

This project follows
[Conventional Commits](https://www.conventionalcommits.org/).
A `.gitmessage` template is available at the repository root for
guidance when writing commit messages.

### Format

```txt
<type>[optional scope]: <user-facing description>

<body: address purpose, context, and what changed>

[optional footer(s)]
```

### Subject line

- Use the format: `<type>[optional scope]: <description>`
- Write from the **user's perspective** — briefly state what this
  commit solves or improves for the end user or developer
- Write in **lowercase**, imperative mood (e.g., "add", not "added")
- Keep the subject line under **72 characters**
- Do **not** end with a period

### Types

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`,
`chore`, `ci`, `build`, `perf`

### Scopes

- Optional, in parentheses: `feat(ci):`, `fix(lint):`, `docs(readme):`
- Keep scopes **lowercase**, short, and consistent
- Use the directory or component name that best describes the area

### Body (line 3+)

The body should address three aspects:

- **Why** — the purpose or motivation behind the change
- **Context** — what was needed, the situation or constraint
- **What changed** — the concrete action taken

Prefer the **why → context → change** order when practical.
Write these as **natural prose** — weave the aspects into
coherent sentences rather than using labeled sections. Labeled
sections (`Why:` / `Context:` / `Change:`) are acceptable only
when explicit paragraph separation improves clarity.

Omit any aspect whose information **cannot be reliably inferred**.
If the subject line is self-explanatory, the body may be omitted
entirely. **Breaking changes must always include a body.**

Wrap body lines at **72 characters**.

### Breaking changes

- Append `!` after the type/scope: `feat!: remove deprecated endpoint`
- Add a `BREAKING CHANGE:` trailer in the footer with a detailed
  explanation of what breaks and migration steps

### Footers / trailers

- `Closes #<issue>` / `Refs #<issue>` — link to issues
- `Co-authored-by: Name <email>` — credit co-authors
- `BREAKING CHANGE: <description>` — detail the breaking change

### Atomic commits

Keep each commit as **small and focused** as possible:

- **One logical change per commit** — if the subject line needs "and",
  consider splitting
- **Separate refactoring** from behavior changes
- **Separate formatting/style** changes from logic changes
- **Separate dependency updates** from code changes
- When in doubt, prefer smaller commits that are easy to review,
  revert, and bisect

### Examples

#### Good — single-line (trivial change)

```txt
fix: correct typo in feature request template
```

#### Good — prose body

```txt
feat(ci): add concurrency settings to lint workflow

Parallel lint runs on the same branch waste resources and
cause race conditions in status checks. GitHub Actions
supports concurrency groups that automatically cancel
redundant runs, so add a concurrency group keyed on branch
name with cancel-in-progress enabled.

Refs #42
```

#### Good — breaking change

```txt
feat!: require node 20 as minimum version

Node 18 reaches end-of-life and lacks native fetch support
used by the new HTTP client. All production environments
have already been upgraded to node 20+, so update the
engines field and CI matrix to require node >= 20.

BREAKING CHANGE: drop support for node 16 and 18. Users
must upgrade to node 20 or later.
Closes #108
```

#### Bad — vague, developer-centric

```txt
fix: update code
```

#### Bad — too large / non-atomic

```txt
feat: add auth system and refactor database layer and update docs
```

## Coding Standards

- **Indentation**: 2 spaces (enforced by `.editorconfig`)
- **Line endings**: LF only (enforced by `.editorconfig` and
  `.gitattributes`)
- **Trailing whitespace**: trimmed (except in Markdown)
- **Final newline**: always present
- **File naming**: lowercase with hyphens (e.g., `feature-request.yml`)
  unless constrained by a platform convention (e.g., `CONTRIBUTING.md`)

## Development

### Install the dependencies

```sh
corepack enable
pnpm install
```

### Linting

```sh
pnpm run lint
pnpm run lint:fix # Lint and auto-fix
```

### Testing

```sh
pnpm run test
```

Currently, the command works as an alias for the `pnpm run lint` command.
Set up your own testing framework and replace this script as needed.

### Cleaning

```sh
pnpm run clean
```

## Testing strategy

Currently, `pnpm run test` is an alias for `pnpm run lint`. When
setting up a derived project, replace this with a real test runner
(e.g., Vitest, Jest) and define:

- **Test location**: co-locate test files next to source or in a
  dedicated `__tests__/` directory
- **Coverage targets**: aim for meaningful coverage; avoid
  coverage-only metrics
- **Test naming**: use descriptive names that explain the expected
  behavior (e.g., `it('returns 404 when user not found')`)
- **CI integration**: ensure tests run in the CI pipeline
  (`.github/workflows/`)

## Monorepo guidance

This template supports pnpm workspaces. When working in a monorepo
configuration:

- **Scoped commands** — prefer `pnpm --filter <package>` over
  running commands at the root to save time and reduce noise
- **Nested AGENTS.md** — consider adding an `AGENTS.md` inside each
  workspace package with package-specific instructions; the nearest
  file in the directory tree takes precedence
- **Package naming** — check the `name` field in each package's
  `package.json` to confirm the correct package name
- **Dependency boundaries** — respect workspace package boundaries;
  avoid circular dependencies between packages

## Guardrails

- **Do not** modify community documents (CODE_OF_CONDUCT, CONTRIBUTING)
  without explicit approval

## Security

These rules follow the
[OpenSSF Security-Focused Guide for AI Code Assistant Instructions](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions.html):

- **No secrets in code** — store credentials in environment variables
  or a secrets manager; never hard-code them
- **Treat AI output as untrusted** — review all generated code for
  correctness, security vulnerabilities, and adherence to project
  standards before committing
- **Validate inputs** — ensure all external data is validated and
  sanitized before use
- **Verify dependencies** — confirm that any recommended packages are
  reputable, actively maintained, and free of known vulnerabilities
- **Recursive review** — when generating security-sensitive code, ask
  the AI to review its own output and suggest improvements before
  accepting

## Project status and IDD workflow

This repository has been onboarded. AI guideline files, README, and
rules documentation have been customized for Dream Duels. Follow-up
issues are completing the multi-agent IDD (Issue-Driven Development)
workflow setup. Once those issues land, the following files will be
present:

- `docs/idd-policy.md` — recorded IDD policy decisions
- `docs/idd-workflow.md` — cross-agent IDD workflow entry path
- `.github/instructions/idd-overview.instructions.md` — phase routing

When those files are present, open `docs/idd-workflow.md` as the
cross-agent entry path before starting IDD work, and open
`.github/instructions/idd-overview.instructions.md` before each
phase change.
