# syntax=docker/dockerfile:1
# Build context: ./client

FROM node:24-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10.34.8
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Development: run with `docker compose watch`; Compose syncs source changes and Vite hot-reloads them.
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
