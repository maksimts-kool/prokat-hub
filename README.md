# Prokat Hub

[![CI](https://github.com/maksimts-kool/prokat-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/maksimts-kool/prokat-hub/actions/workflows/ci.yml)

A rental management system for an **electronics** rental shop: customers browse cameras, drones, laptops and more, check availability for their dates and book them; staff issue and receive items; admins manage the catalogue and see reports.

One responsive website (React) talks to an ASP.NET Core Web API. Everything runs in Docker Compose.

> Work in progress. The full README comes in #39 and the Estonian documentation in #40.

## Repository layout

| Folder | Contents |
| --- | --- |
| `server/` | .NET 10 solution `ProkatHub.slnx` |
| `server/ProkatHub.Api/` | ASP.NET Core Web API: controllers, services, repositories, EF Core (PostgreSQL), Identity + JWT |
| `server/ProkatHub.Worker/` | Hourly Worker Service that calls the API as the Service account |
| `server/ProkatHub.Tests/` | xUnit unit tests |
| `client/` | React web client: Vite, TypeScript, Tailwind CSS, shadcn/ui ([client/README.md](client/README.md)) |
| `docs/` | Domain model, ER diagram and business rules ([docs/er-diagram.md](docs/er-diagram.md)) |
| `http/` | `.http` request files for the API |
| `.github/workflows/` | GitHub Actions CI ([ci.yml](.github/workflows/ci.yml)) |
| `agent/` | Project brief |

## Quick start

Requirements: Docker Desktop (Compose v2.22+).

```bash
cp .env.example .env
docker compose watch
```

`docker compose watch` builds and starts PostgreSQL, the API and the web client, then syncs code changes into the containers: `dotnet watch` reloads the API and Vite hot-reloads the client. Use `docker compose up -d` to run without hot reload.

On startup in Development the API applies EF Core migrations and seeds the demo catalogue, discount tiers, one account per role and a few demo rentals.

| URL | What |
| --- | --- |
| http://localhost:5173 | Web client |
| http://localhost:8080/swagger | Swagger UI (Development only) |
| http://localhost:8080/openapi/v1.json | OpenAPI document |
| http://localhost:8080/health | Health check (API + database) |

Seeded accounts (passwords are the `SEED_*_PASSWORD` values in `.env`):

| Role | Email |
| --- | --- |
| Admin | `admin@prokathub.test` |
| Staff | `staff@prokathub.test` |
| Customer | `customer@prokathub.test` |
| Service | `service@prokathub.test` |

In Swagger, call `POST /api/auth/login`, copy `accessToken`, click **Authorize** and paste it.

### Logs

```bash
docker compose logs -f api
```

The API logs through [Serilog](https://serilog.net/) and writes one line per request with method, path, status, duration, user id and trace id. The trace id is the same as `traceId` in error responses, so a failed call in the browser can be matched with its log line. `/health`, Swagger and OpenAPI requests are logged at Debug and hidden by default. Levels and the output format live in the `Serilog` section of `appsettings.json`. Override them with environment variables in `compose.yaml`, for example `Serilog__MinimumLevel__Override__Microsoft.EntityFrameworkCore.Database.Command: Information` to see SQL queries.

## Development without Docker

The API also runs on the host with the .NET 10 SDK, using the Docker database:

```bash
docker compose up -d db
cd server/ProkatHub.Api
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=prokathub;Username=prokathub;Password=<POSTGRES_PASSWORD>"
dotnet user-secrets set "Jwt:SigningKey" "$(openssl rand -base64 48)"
dotnet user-secrets set "Seed:Accounts:Customer:Password" "Customer12345"
dotnet run
```

Run the tests with `dotnet test server/ProkatHub.slnx`. Add a migration with:

```bash
cd server
dotnet tool restore
dotnet ef migrations add <Name> --project ProkatHub.Api --output-dir Data/Migrations
```

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and on pull requests to `main`, with three jobs:

| Job | What it checks |
| --- | --- |
| Server | `dotnet build` and `dotnet test` for `server/ProkatHub.slnx` (Release) |
| Client | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and `pnpm test` once the client has a test script |
| Docker images | `docker compose build` for the dev images, plus the production API image (`API_BUILD_TARGET=final`) |
