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

# Production build. Vite bakes VITE_API_URL into the bundle, so it is a build argument here,
# not a runtime variable: the browser calls the API at this address.
FROM deps AS build
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm build

# Production: the built client served by nginx as a non-root user. It listens on 5173 like the
# dev server, so Compose maps the same port whichever target is built.
FROM nginxinc/nginx-unprivileged:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5173
