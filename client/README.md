# client

The Prokat Hub web client: React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, React Router, Lucide icons and Sonner toasts.

## Run

With Docker (from the repository root), together with the API and database:

```bash
docker compose watch
```

Open http://localhost:5173. Code changes are synced into the container and Vite reloads them.

On the host (Node 22.12+ and pnpm):

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

## Scripts

| Command                             | What it does                    |
| ----------------------------------- | ------------------------------- |
| `pnpm dev`                          | Vite dev server with hot reload |
| `pnpm build`                        | Type-check and build to `dist/` |
| `pnpm lint`                         | oxlint                          |
| `pnpm format` / `pnpm format:check` | Prettier                        |

## Configuration

| Variable       | Default                 | Meaning                                          |
| -------------- | ----------------------- | ------------------------------------------------ |
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the API, read in `src/lib/config.ts` |

## Structure

| Folder                   | Contents                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| `src/components/ui/`     | shadcn/ui components (add more with `pnpm dlx shadcn@latest add <name>`) |
| `src/components/layout/` | App layout: header, navigation, mobile menu, footer                      |
| `src/pages/`             | One component per route                                                  |
| `src/router.tsx`         | Route table                                                              |
| `src/lib/`               | Helpers and configuration                                                |
