APP_NAME ?= it-crowd-backend
IMAGE ?= ghcr.io/your-org/$(APP_NAME)
TAG ?= latest
CR ?= ghcr.io

.PHONY: install dev typecheck lint test build migrate up down logs compose-up compose-down compose-logs docker-build docker-push docker-run cr-login

install:
	pnpm install

dev:
	pnpm --filter it-crowd-backend dev

typecheck:
	pnpm --filter it-crowd-backend typecheck

lint:
	pnpm --filter it-crowd-backend lint

test:
	pnpm --filter it-crowd-backend test

build:
	pnpm --filter it-crowd-backend build

migrate:
	pnpm --filter it-crowd-backend db:migrate

up:
	docker compose up $(patsubst pg,postgres,$(filter-out $@,$(MAKECMDGOALS))) -d

down:
	docker compose down $(patsubst pg,postgres,$(filter-out $@,$(MAKECMDGOALS)))

logs:
	docker compose logs -f $(patsubst pg,postgres,$(filter-out $@,$(MAKECMDGOALS)))

compose-up: up
compose-down: down
compose-logs: logs

cr-login:
	docker login $(CR)

docker-build:
	docker build -f backend/Dockerfile -t $(IMAGE):$(TAG) .

docker-push:
	docker push $(IMAGE):$(TAG)

docker-run:
	docker run --rm -p 8000:8000 --env-file backend/.env $(IMAGE):$(TAG)

%:
	@:
