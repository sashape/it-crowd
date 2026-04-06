# Pnpm, Alias Imports, and Deploy Instructions

## Goal
Migrate the repository from npm to pnpm, introduce `~/` import alias across backend source code, and add deployment instructions in `AGENT_RULES/DEPLOY.md` with Docker, CR (container registry), and Makefile usage.

## Scope
Included:
- switch workspace scripts and lockfile strategy to pnpm;
- configure TypeScript alias `~/* -> src/*` for backend;
- refactor backend source imports to use `~/...`;
- ensure build/dev pipeline works with aliases;
- add deployment instruction doc `AGENT_RULES/DEPLOY.md` covering Docker image build/push and Makefile workflows.

Out of scope:
- frontend architecture changes;
- runtime behavior changes in domain logic;
- production infra provisioning scripts.

## Plan
- [x] Update workspace/package-manager config for pnpm.
- [x] Configure backend alias support (`tsconfig`, build scripts).
- [x] Refactor backend source imports to `~/...`.
- [x] Add deployment guide and supporting deployment helper files.
- [x] Run validation (typecheck, lint, test, build).

## Progress
- 2026-04-07: Created task log and decomposition.
- 2026-04-07: Added `pnpm-workspace.yaml`, switched root scripts to pnpm filters, and generated `pnpm-lock.yaml`.
- 2026-04-07: Updated backend build pipeline to use `tsc-alias`, added TS path mapping for `~/`.
- 2026-04-07: Refactored backend source imports from relative paths to `~/...` alias.
- 2026-04-07: Added deployment artifacts: `AGENT_RULES/DEPLOY.md`, `Makefile`, `backend/Dockerfile`, `.dockerignore`.
- 2026-04-07: Updated README run instructions to pnpm and linked deploy guide.

## Validation
- `pnpm --filter it-crowd-backend typecheck`
- `pnpm --filter it-crowd-backend lint`
- `pnpm --filter it-crowd-backend test`
- `pnpm --filter it-crowd-backend build`

## Result
Completed:
- repository now uses pnpm workspace flow,
- backend internal imports use `~/` alias,
- compiled output rewrites aliases correctly for Node runtime,
- deploy instructions include Docker/CR/Makefile flow,
- helper files added for reproducible local and CI deploy commands.

Remaining:
- optional: add CI workflow that uses `make docker-build` and `make docker-push`.

## Files touched
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `README.md`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/vitest.config.ts`
- `backend/src/**/*.ts` (import alias migration)
- `AGENT_RULES/DEPLOY.md`
- `Makefile`
- `backend/Dockerfile`
- `.dockerignore`
- `docs/feature-log/2026/04/07/0037-pnpm-alias-deploy.md`
