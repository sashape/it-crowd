# IT-CROWD v1

Backend-first digital company platform.

## Current focus
- TypeScript + Fastify + Postgres + WebSocket
- Single-tenant founder mode
- Software-team template bootstrap (PM/TL/BE/FE/QA)
- Runtime adapter boundary for future OpenClaw integration
- LLM modes: live_with_fallback, mock_static, mock_deterministic

## Run
1. Create Postgres database and set `backend/.env` from `backend/.env.example`.
2. Install dependencies:
   - `npm install`
3. Apply migration:
   - `npm run db:migrate --workspace backend`
4. Start backend:
   - `npm run dev --workspace backend`

## API highlights
- `POST /api/company/bootstrap`
- `GET /api/company/state`
- `GET /api/agents`
- `GET /api/tasks`
- `GET /api/approvals`
- `GET /api/events`
- `GET /api/orchestration/runs`
- `GET /api/orchestration/runs/:id`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/messages`
- `POST /api/approvals/:id/decision`
- `GET /ws/events`

## Notes
- All POST endpoints require `Idempotency-Key`.
- Deterministic mock mode supports full flow without external LLM keys.