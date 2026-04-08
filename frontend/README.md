# IT-CROWD Frontend

Main founder screen built as a retro-future pixel office.

## What it includes
- bootstrap form when company is not initialized;
- scene-first office UI (70/30 desktop, stacked mobile);
- PixiJS office scene with moving PM/TL/BE/FE/QA agents;
- speech bubbles driven by messages/events;
- side panels for tasks, events, approvals, and runs.

## Local run
- `pnpm --filter it-crowd-frontend dev`

By default frontend expects backend at `http://localhost:8000`.
Set `VITE_API_BASE_URL` to override.

## Checks
- `pnpm --filter it-crowd-frontend typecheck`
- `pnpm --filter it-crowd-frontend test`
- `pnpm --filter it-crowd-frontend build`
