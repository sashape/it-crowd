# Deploy Doc Rename and Docker Compose

## Goal
Rename and move deploy instructions from `DEPLY.md` to `AGENT_RULES/DEPLOY.md`, reference the deploy rules from `AGENTS.md`, and add a working `docker-compose` setup for backend + postgres.

## Scope
Included:
- rename/move deploy instruction file;
- update references in docs;
- add deploy-rule mention in `AGENTS.md`;
- add root `docker-compose.yml` for local orchestration;
- align `Makefile` and deploy doc with compose workflow.

Out of scope:
- Kubernetes manifests;
- production secrets management;
- CI/CD workflow automation.

## Plan
- [x] Create/refresh deploy doc at `AGENT_RULES/DEPLOY.md`.
- [x] Remove old root `DEPLY.md` and update references.
- [x] Update `AGENTS.md` required-files section with deploy guidance reference.
- [x] Add `docker-compose.yml` and related Makefile targets.
- [x] Validate docs/commands consistency and record result.

## Progress
- 2026-04-07: Started task log and implementation steps.
- 2026-04-07: Moved and renamed deploy guide to `AGENT_RULES/DEPLOY.md`.
- 2026-04-07: Normalized AGENTS instructions and added explicit deploy rules reference.
- 2026-04-07: Added `docker-compose.yml` with `backend` + `postgres` services and healthcheck dependency.
- 2026-04-07: Added `compose-up`, `compose-down`, `compose-logs` targets to Makefile.
- 2026-04-07: Updated README deploy reference to new document path.

## Validation
- `pnpm --filter it-crowd-backend typecheck`
- `pnpm --filter it-crowd-backend lint`
- `pnpm --filter it-crowd-backend test`
- `pnpm --filter it-crowd-backend build`

## Result
Completed:
- deploy instructions are now correctly named and located under `AGENT_RULES/DEPLOY.md`;
- `AGENTS.md` now references deploy instructions explicitly;
- local multi-container run flow added via `docker-compose.yml`;
- Makefile now wraps compose lifecycle commands.

Remaining:
- optional: add CI job to validate `docker compose config` and image build on PRs.

## Files touched
- `AGENTS.md`
- `AGENT_RULES/DEPLOY.md`
- `docker-compose.yml`
- `Makefile`
- `README.md`
- `docs/feature-log/2026/04/07/0044-deploy-doc-rename-and-compose.md`