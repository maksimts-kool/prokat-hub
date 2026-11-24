# Prokat Hub

[![CI](https://github.com/maksimts-kool/prokat-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/maksimts-kool/prokat-hub/actions/workflows/ci.yml)

A rental management system for an **electronics** rental shop: customers browse cameras, drones, laptops and more, check availability for their dates and book them; staff issue and receive items; admins manage the catalogue and see reports.

One responsive website (React) talks to an ASP.NET Core Web API. Everything runs in Docker Compose.

> Work in progress. The full README comes in #39 and the Estonian documentation in #40.

## Repository layout

| Folder | Contents |
| --- | --- |
| `server/` | .NET 10 solution `ProkatHub.slnx` |
| `server/ProkatHub.Api/` | ASP.NET Core Web API: controllers, services, repositories, EF Core (MariaDB via Pomelo), Identity + JWT |
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

`docker compose watch` builds and starts MariaDB, the API, the overdue worker and the web client, then syncs code changes into the containers: `dotnet watch` reloads the API and Vite hot-reloads the client. Use `docker compose up -d` to run without hot reload.

On startup in Development the API applies EF Core migrations and seeds the demo catalogue, discount tiers, one account per role and a few demo rentals.

| URL | What |
| --- | --- |
| http://localhost:5173 | Web client |
| http://localhost:8080/swagger | Swagger UI (Development only) |
| http://localhost:8080/openapi/v1.json | OpenAPI document |
| http://localhost:8080/health | Health check (API + database) |
| ws://localhost:8080/ws/availability | SignalR hub for live availability updates (signed-in users) |

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

### Overdue worker

`ProkatHub.Worker` is a separate .NET Worker Service that marks overdue rentals. Once at startup and then every hour (`WORKER_INTERVAL` in `.env`) it logs in as the Service account, calls `GET /api/rentals/overdue` and then `POST /api/rentals/{id}/mark-late` for each rental, and writes a summary line:

```bash
docker compose logs -f worker
```

It only talks to the API over HTTP (`http://api:8080` in Compose) and has no database access. The token is reused until shortly before it expires; a 401 logs in again once. The typed `HttpClient` has the standard Polly resilience pipeline (retries with backoff, timeouts, circuit breaker), tuned in the `Resilience` section of its `appsettings.json` so calls wait out an API restart. A failed run is logged and the worker carries on with the next one.

To run it on the host against a running API:

```bash
cd server/ProkatHub.Worker
dotnet user-secrets set "Api:Password" "<SEED_SERVICE_PASSWORD>"
dotnet run
```

### Live availability (SignalR)

The SignalR hub at `/ws/availability` tells connected clients when an item's availability changes, so pages update without a refresh. Any signed-in user may connect. Browsers can't send an `Authorization` header when opening a WebSocket, so the client passes the JWT as the `access_token` query parameter (`accessTokenFactory` in `@microsoft/signalr` does this). The token is read from the query string only on `/ws` paths, and request logs show it as `access_token=***`.

Clients only listen. After a change is saved the API sends `AvailabilityChanged` with `{ itemId, from, to }` (dates as `yyyy-MM-dd`, both inclusive) to every connection:

| Change | `from` – `to` |
| --- | --- |
| Rental booked | the booked days |
| Rental cancelled or returned | the days it held, up to today for a late return |
| Rental marked late (`mark-late`) | the day after the end date – today; sent once a day, not on every hourly run |

A client showing that item for overlapping dates should reload its availability. `RentalService` sends events through `IAvailabilityNotifier`, so its tests use a mock; a failed broadcast is logged and doesn't fail the request.

In the web client, `LiveAvailabilityProvider` (`client/src/realtime/`) keeps one connection open while someone is signed in. On `AvailabilityChanged` it invalidates the TanStack Query caches the change touches: that item's booked days and quotes for overlapping dates, and catalogue lists searched by overlapping dates or sorted by popularity. An open item page therefore shows another customer's booking without a refresh, and its "Live availability" dot shows the connection is up. The connection reconnects by itself, retrying every 30 s at most for as long as it takes, and reloads all availability data once it is back, since events sent in between are lost. A notice appears only while an open connection is lost. Guests are not connected, because the hub only accepts signed-in users.

## Development without Docker

The API also runs on the host with the .NET 10 SDK, using the Docker database:

```bash
docker compose up -d db
cd server/ProkatHub.Api
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost;Port=3306;Database=prokathub;User=prokathub;Password=<DB_PASSWORD>"
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

## Deployment (Zone.ee)

The live site runs on a Zone.ee virtual server, which has no Docker, at `/prokathub` of the account's website:

- The **API** and the **worker** are self-contained `linux-x64` builds that PM2 keeps running.
- The API also serves the production build of the **web client** from its `wwwroot`, so the site and the API share one origin.
- The `PathBase` setting tells the API that requests arrive under `/prokathub`.
- Apache forwards `/prokathub` to the API with an `.htaccess` proxy rule.
- The **database** is the account's MariaDB from MyZone. The API applies migrations on startup.

```bash
cp deploy/zone/zone.env.example deploy/zone/zone.env   # once: server, paths, port, database name and user
deploy/zone/deploy.sh                                 # build, upload, write the proxy rule and PM2 files, (re)start
```

The first run writes `~/prokathub/api.pm2.json` and `worker.pm2.json` on the server, with a generated JWT key and seed account passwords. These secrets stay on the server only. Then:

```bash
deploy/zone/set-db-password.sh   # asks for the MyZone database password and stores it on the server
deploy/zone/deploy.sh            # starts both apps
```

Register both PM2 files in MyZone (PM2 rakendused), so Zone keeps the apps running after a server restart.

The app's settings live in the `env` of those PM2 files on the server. Nested settings use `__` in place of `:`, for example `Seed__DemoData` or `Overdue__Interval`. To change them:

```bash
deploy/zone/edit-env.sh          # API settings: opens nano on the server, checks the JSON, reloads the app
deploy/zone/edit-env.sh worker   # worker settings
deploy/zone/db-query.sh "SELECT Email FROM AspNetUsers"   # SQL against the live database
```

Edits survive later deploys. `deploy.sh` only rewrites the address, path, database and CORS settings that come from `zone.env`, and the worker's login. Set a seed account's password to `""` to stop the API from recreating that account. After changing `DB_PASSWORD`, run `deploy.sh` so the connection string is rebuilt.

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and on pull requests to `main`, with three jobs:

| Job | What it checks |
| --- | --- |
| Server | `dotnet build` and `dotnet test` for `server/ProkatHub.slnx` (Release) |
| Client | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and `pnpm test` once the client has a test script |
| Docker images | `docker compose build` for the dev images, plus the production API image (`API_BUILD_TARGET=final`) |
