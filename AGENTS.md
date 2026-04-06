# AGENT.md

## Mission
Build IT-CROWD v1 as a backend-first digital company platform with strong architectural boundaries, deterministic behavior in mock mode, and observable orchestration through persisted state and domain events.

The system must remain:
- predictable
- testable
- explainable
- idempotent
- safe against runaway orchestration

## Product boundaries
Current scope:
- single-tenant founder mode
- software-team template
- Postgres as source of truth
- REST + WebSocket API
- adapter-first runtime boundary for future OpenClaw integration
- real LLM providers with deterministic mock fallback

Do not expand scope implicitly.
Do not add multi-tenant auth, full container orchestration, or broad platform abstractions unless explicitly requested.

## Required instruction files
Use this file as the top-level operating guide.

Before starting any non-trivial task, also read:
- `AGENT_RULES/CODING_RULES.md` - implementation, architecture, validation, testing, and review rules
- `AGENT_RULES/TASK_WORKFLOW.md` - task decomposition, feature logs, intermediate commits, git workflow, and GitHub publishing rules
- `AGENT_RULES/DEPLOY.md` - deployment workflow with Docker, CR, docker-compose, and Makefile targets

If the repository contains feature-specific plans or task documents, follow them together with this file.

## Core architectural rules
- Route handlers validate input, call use-cases, and map responses.
- Use-cases coordinate business actions.
- Orchestrator coordinates workflow steps.
- Policy Engine evaluates rules and returns decisions.
- Runtime Adapter executes runtime operations only.
- Repositories handle persistence.
- Event publishing must happen from application/use-case flows, not transport glue.

## Hard boundaries
- Keep policy logic out of orchestrator.
- Keep runtime adapters free of domain decision logic.
- Keep business logic out of route handlers.
- Keep direct database access out of transport code.
- Keep meaningful side effects observable through persisted state and/or domain events.
- Prefer explicit domain types, enums, schemas, and decision objects over hidden conventions.

## Task execution rules
For any non-trivial task, you must:
- decompose the work into concrete implementation steps
- create or update a markdown feature log
- implement in coherent increments
- validate each increment
- commit meaningful intermediate progress
- keep the branch reviewable
- push only when the branch is understandable, stable, and ready for review

Do not treat multi-step work as one opaque patch.

## Feature log rule
Every non-trivial task must have a markdown feature log that records:
- goal
- scope
- plan
- progress
- validation
- result or remaining work

Standard location:
- `docs/feature-log/YYYY/MM/DD/HHMM-short-feature-name.md`

Do not use raw private reasoning as project documentation.

## Git and publishing rules
For non-trivial work:
- make meaningful intermediate commits
- use clear commit messages
- do not keep all progress uncommitted until the end
- keep the branch reviewable at each major step

Push to GitHub only when publishing is part of the task or expected by the workflow, and only after relevant checks pass and the feature log is updated.

## Implementation rules
Follow:
- `AGENT_RULES/CODING_RULES.md` for code structure, validation, testing, and review
- `AGENT_RULES/TASK_WORKFLOW.md` for decomposition, logging, commits, and GitHub workflow
- `AGENT_RULES/DEPLOY.md` for deployment commands and docker-compose usage

## Red lines
Do not:
- put policy logic into controllers, orchestrator internals, adapters, or UI code
- add POST endpoints without idempotency
- introduce untyped handoff payloads
- silently change domain behavior through hidden fallback logic
- broaden scope with unrelated refactors
- skip decomposition for multi-step tasks
- skip the feature log for non-trivial work
- keep all progress uncommitted until the very end
- push unexplained or unstable changes when a coherent intermediate state was possible
- expose raw internal reasoning where compact summaries are expected

## Operating principle
Choose the most conservative implementation that:
- preserves architecture
- keeps behavior observable
- remains deterministic in mock mode
- and solves the user-visible task without unnecessary expansion

For any non-trivial task:
- read `AGENT_RULES/CODING_RULES.md`
- read `AGENT_RULES/TASK_WORKFLOW.md`
- read `AGENT_RULES/DEPLOY.md` when touching deployment or runtime operations
- decompose the work
- log the work
- implement in steps
- validate each step
- commit intermediate progress
- and only then publish the result
