# Rendisüsteem — Suggested Tech Stack

> This is only a suggested stack, not a strict requirement. Feel free to replace, add, or remove technologies whenever a better or simpler option fits the project.

## Frontend (responsive web app only)
- React 19 + TypeScript + Vite
- Tailwind CSS 4 + shadcn/ui
- React Router
- TanStack Query + TanStack Table
- React Hook Form + Zod
- Orval + Fetch
- React DayPicker + date-fns
- Lucide React + Sonner
- Recharts (if charts are needed)
- SignalR JavaScript client
### New
- react-i18next
- Playwright (idk if useful) (optional)
- Lighthouse (idk if useful) (optional)

## Backend
- ASP.NET Core 10 Web API (C#)
- Entity Framework Core 10 + Npgsql
- ASP.NET Core Identity + JWT authentication and roles
- SignalR (real-time availability)
- OpenAPI + Swagger UI
- ProblemDetails + ILogger
- Separate .NET Worker Service + HttpClient
### New
- FluentValidation
- Mapperly
- Swashbuckle
- Serilog

## Background Worker
- PeriodicTimer (inside BackgroundService)
- Polly

## Database, testing and tools
- PostgreSQL
- xUnit + NSubstitute
- Vitest + React Testing Library
- Docker Compose
- pnpm + ESLint + Prettier
- GitHub + GitHub Projects + GitHub Actions
### New
- actions/setup-dotnet + actions/setup-node: build and test steps in CI
- crazy-max/ghaction-github-labeler: keeps the required labels in a file in the repo (idk if useful)
- Shouldly (idk if useful)
- Testcontainers (idk if useful) (optional)

**Client scope:** One responsive website for desktop, tablet, and mobile browsers; no separate mobile app planned.
