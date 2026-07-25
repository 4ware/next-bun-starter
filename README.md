# Next Bun Starter

Full-stack TypeScript boilerplate:

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Bun** as package manager, test runner, and (optionally) runtime
- **Elysia.js** mounted as the API layer inside Next.js route handlers
- **Drizzle ORM** + PostgreSQL (postgres-js driver)
- **better-auth** (email/password) with Drizzle adapter
- **Tailwind CSS v4** (CSS-first config) + **shadcn/ui**
- **TanStack Form** + **Zod 4** (Standard Schema — no adapter needed)
- **bun test** + **React Testing Library** + happy-dom

## Getting started

```bash
bun install
cp .env.example .env          # then set DATABASE_URL and a real secret
openssl rand -base64 32       # -> BETTER_AUTH_SECRET

bun run db:push               # or: bun run db:generate && bun run db:migrate
bun run dev                   # http://localhost:3000
```

`bun run dev` runs the Next.js CLI on Node. To run Next.js on the Bun runtime
instead, use `bun --bun next dev`.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` / `build` / `start` | Next.js dev server / production build / serve |
| `bun run dev:realtime` | Standalone WebSocket server (auth-gated live lobby, port 3001) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun test` / `bun run test:watch` | Run the test suite (happy-dom preloaded via `bunfig.toml`) |
| `bun run db:generate` | Generate SQL migrations from the Drizzle schema |
| `bun run db:migrate` / `db:push` | Apply migrations / push schema directly |
| `bun run db:studio` | Drizzle Studio |

## Architecture

```
src/
  app/
    api/[[...slugs]]/route.ts   # Elysia mounted on all /api/* routes
    api/auth/[...all]/route.ts  # better-auth handler (more specific, wins over the catch-all)
    (auth)/sign-in, sign-up     # auth pages (TanStack Form + zod)
    dashboard/                  # session-protected server component
  server/
    api/                        # Elysia app, auth macro, example /api/todos CRUD
    realtime/                   # standalone Elysia WebSocket server (bun run dev:realtime)
    db/                         # drizzle client + schema (auth tables, todos)
    auth.ts                     # better-auth config (drizzle adapter, nextCookies plugin)
  components/
    ui/                         # shadcn/ui components (button, input, label, card)
    forms/                      # createFormHook composition + sign-in/sign-up forms
  lib/
    env.ts                      # zod-validated env
    auth-client.ts              # better-auth react client
    validators/                 # shared zod schemas
  test/
    setup.ts                    # happy-dom registration, jest-dom matchers, cleanup
```

### How the pieces fit

**Elysia inside Next.js.** The optional catch-all route `app/api/[[...slugs]]/route.ts`
forwards every HTTP method to `api.handle`. better-auth keeps its own more
specific route at `/api/auth/[...all]`, which Next.js matches first. The
`authPlugin` macro resolves the better-auth session from request headers, so
Elysia routes opt in with `{ authenticated: true }` and get typed `user`/`session`.

**Realtime WebSockets.** Next.js route handlers can't upgrade to WebSocket, so
`src/server/realtime` is a separate Elysia app run directly with Bun
(`bun run dev:realtime`). It reuses the same better-auth instance: the browser
sends the session cookie on the ws upgrade (same host, different port), and an
instance-level `.resolve()` rejects handshakes without a session (401) or from
foreign origins (403). The dashboard's `LivePanel` connects to
`NEXT_PUBLIC_REALTIME_URL` for an auth-gated live lobby (presence + chat).

**TanStack Form.** `src/components/forms/form.tsx` uses the `createFormHook`
composition pattern: `TextField` and `SubmitButton` are bound to form context
once and reused in every form. Zod schemas plug directly into
`validators: { onChange: schema }` because Zod implements Standard Schema.

**Testing.** `bunfig.toml` preloads `src/test/setup.ts`, which registers
happy-dom globals, extends `expect` with jest-dom matchers (typed via
`src/test/matchers.d.ts`), and runs RTL `cleanup` after each test. Module mocks
use `mock.module(...)` — see `sign-in-form.test.tsx`. Note: import the component
under test *after* `mock.module` calls (dynamic import in `beforeAll`).

**shadcn/ui.** `components.json` is configured, so more components install with
`bunx shadcn@latest add <component>`.

## Adding fonts

The layout uses a system font stack to stay offline-friendly. To use
`next/font/google`, add it back in `src/app/layout.tsx` (requires network
access at build time).
