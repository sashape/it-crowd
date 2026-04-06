FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN pnpm install --frozen-lockfile

COPY backend backend

RUN pnpm --filter it-crowd-backend build

FROM node:22-alpine AS runtime

WORKDIR /app

RUN corepack enable

COPY --from=build /app /app

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "dist/src/index.js"]