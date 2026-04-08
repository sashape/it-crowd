# DEPLOY Instructions

This document describes the standard deploy flow for IT-CROWD backend using Docker, CR (Container Registry), docker-compose, and Makefile targets.

## Prerequisites
- Docker installed and running.
- Access to your CR (for example: `ghcr.io`, Docker Hub, Harbor, ECR).
- `pnpm` available locally for build/test steps.

## Terminology
- `CR` means **Container Registry**.
- `IMAGE` means the full registry path, for example: `ghcr.io/your-org/it-crowd-backend`.
- `TAG` means image tag, for example: `v1.0.0` or `latest`.

## Local Build and Validation
Use Makefile wrappers:

```bash
make install
make typecheck
make lint
make test
make build
```

## Docker Compose (Local Stack)
Start backend + postgres:

```bash
make compose-up
```

Start only postgres service (example):

```bash
make up postgres
make up pg
```

Stop stack:

```bash
make compose-down
```

Show logs:

```bash
make compose-logs
```

The compose file is `docker-compose.yml` in the repository root.

## Docker Image Build
Build backend image:

```bash
make docker-build IMAGE=ghcr.io/your-org/it-crowd-backend TAG=latest
```

The command uses `backend/Dockerfile` and produces a runnable image with compiled backend output.

## CR Login and Push
Login to your CR:

```bash
make cr-login CR=ghcr.io
```

Push image:

```bash
make docker-push IMAGE=ghcr.io/your-org/it-crowd-backend TAG=latest
```

## Run Container Locally
Run image with env file mapping and API port:

```bash
make docker-run IMAGE=ghcr.io/your-org/it-crowd-backend TAG=latest
```

By default container exposes `8000`.

## Minimal Release Flow
1. `make test` and `make build`
2. `make docker-build IMAGE=<CR_PATH> TAG=<VERSION>`
3. `make cr-login CR=<REGISTRY_HOST>`
4. `make docker-push IMAGE=<CR_PATH> TAG=<VERSION>`
5. Deploy from CR using your target platform (VM, k8s, etc.)
