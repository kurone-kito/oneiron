# IDD Policy Decisions — oneiron

This document records the IDD (Issue-Driven Development) policy
decisions for `kurone-kito/oneiron`. It is the canonical source read
by `idd-overview.instructions.md` and other IDD phase files after the
idd-skill template is imported (see the sibling issue).

## Step 1A — Placeholder values

| Placeholder | Value |
| --- | --- |
| `{{REPO_NAME}}` | `kurone-kito/oneiron` |
| `{{PROJECT_MARKER_PREFIX}}` | `oneiron` |
| `{{TRUSTED_MARKER_ACTOR}}` | `kurone-kito` |
| `{{INSTALL_DEPS_COMMAND}}` | `corepack enable && pnpm install` |
| `{{FIX_VALIDATE_COMMANDS}}` | `pnpm run lint:fix` |
| `{{PRE_PUSH_VALIDATE_COMMANDS}}` | `pnpm run lint` |
| `{{POST_FIX_VALIDATE_COMMANDS}}` | `pnpm run lint` |

## Step 1B — Policy decisions

### Merge policy

**Value**: `fully_autonomous_merge`

The project uses scale-out multi-AI-agent parallel IDD, so a single
trusted worker session carries implementation through to merge. This is
appropriate for a solo-maintainer repository where the author is the
scheduling agent.

### PR review profile

**Value**: `copilot-advisory` (distributed default)

CodeRabbit is also active (`.coderabbit.yaml` is present). The Copilot
advisory review layers on top of CodeRabbit rather than replacing it.
If Copilot is rate-limited, self-review (C phase) is the primary gate.

### Review-thread resolution policy

**Value**: `fast-agent-resolve` (distributed default)

An agent may resolve review threads after acting on accepted, rejected,
or advisory feedback. The project does not require reviewer
acknowledgement before resolution.

### Critique-loop profile

**Value**: distributed defaults

No repository-specific override. The standard C-phase critique loop
applies with `critiqueLoop.cPhaseLowSeveritySkipAfter: 3`.

### Credential scope

Workers use the current `gh` CLI session, which has repository-scoped
write access. Merge-capable sessions use the same credential — no split
credential scope is configured.

### Claim-timing defaults

**Values**: distributed defaults from `docs/policy-constants.md`

- `claim-stale-age`: 24 h
- `claim-heartbeat-interval`: 12 h

No repository-specific overrides.

### CI wait policy defaults

**Values**: distributed defaults from `docs/policy-constants.md`

No repository-specific overrides for `ciWait.runningTimeout`,
`ciWait.generationTimeout`, or `ciWait.rerunPolicy`.

### Issue-author approval gate

**Value**: `disabled` (`skipIssueAuthorApprovalGate: true`)

The sole maintainer (`kurone-kito`) creates all issues and is always
self-authorized. The gate adds no safety margin in this single-author
setup and would slow down the parallel IDD loop.

### Maintainer approval actor policy

**Value**: `owners-and-maintainers-only` (distributed default)

Only repository owners and collaborators with Maintain or Admin
permission are trusted marker actors and approval actors.

### Issue-authoring companion

**Value**: `installed`

The `skills/issue-authoring/` companion bundle is installed (by the
idd-skill import issue) for pre-execution issue drafting and roadmap
decomposition.

### Helper runtime profile

**Value**: `helper-runtime` (Node helper scripts)

The project uses Node.js/pnpm pervasively, so the Node helper scripts
(`scripts/idd-doctor.mjs`, etc.) are available after the idd-skill
import issue completes. Using helper runtime reduces E/F phase context
load.

## Project structure (for IDD phase files)

| Item | Value |
| --- | --- |
| Doc/issue language | Bilingual (`README.md` + `README.ja.md`); issue bodies default English |
| Workspace layout | `packages/{core,web,…}` (flat pnpm workspaces) |
| Package naming | `@kurone-kito/oneiron-*` |
| Primary rules source | `docs/rules.ja.md` (canonical), `docs/rules.md` (English stub) |
