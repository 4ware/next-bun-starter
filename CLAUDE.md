# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install                        # install deps
bun run dev                        # Next.js dev server (Turbopack) on Node
bun run dev:realtime               # standalone WebSocket server (port 3001, --watch)
bun --bun next dev                 # dev server on the Bun runtime instead of Node
bun run build / start              # production build / serve
bun run typecheck                  # tsc --noEmit
bun run lint                       # next lint

bun test                           # run full test suite
bun run test:watch                 # watch mode
bun test src/lib/validators/auth.test.ts   # run a single test file
bun test -t "test name"            # filter by test name

bun run db:generate                # generate SQL migration from schema changes
bun run db:migrate                 # apply migrations
bun run db:push                    # push schema directly (skip migration files)
bun run db:studio                  # Drizzle Studio
```

Copy `.env.example` to `.env` before running anything that touches the DB or auth (`DATABASE_URL`, `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`).

## Architecture

Full-stack TypeScript app: Next.js 16 (App Router) + React 19, Bun as package manager/test runner, Elysia as the API layer, Drizzle ORM + Postgres, better-auth, Tailwind v4 + shadcn/ui, TanStack Form + Zod 4.

```
src/
  app/
    api/[[...slugs]]/route.ts   # Elysia mounted on all /api/* routes
    api/auth/[...all]/route.ts  # better-auth handler (more specific, wins over the catch-all)
    (auth)/sign-in, sign-up     # auth pages (TanStack Form + zod)
    dashboard/                  # session-protected server component
  server/
    api/                        # Elysia app, auth macro, route modules
    realtime/                   # standalone Elysia WebSocket server (separate Bun process)
    db/                         # drizzle client + schema (auth tables, todos)
    auth.ts                     # better-auth config (drizzle adapter, nextCookies plugin)
  components/
    ui/                         # shadcn/ui components
    forms/                      # createFormHook composition + sign-in/sign-up forms
  lib/
    env.ts                      # zod-validated env (server vs client schemas)
    auth-client.ts              # better-auth react client
    validators/                 # shared zod schemas
  test/
    setup.ts                    # happy-dom registration, jest-dom matchers, RTL cleanup
```

### Elysia inside Next.js

The optional catch-all route `app/api/[[...slugs]]/route.ts` forwards every HTTP method to `api.handle`, where `api` is defined in `src/server/api/index.ts`. better-auth keeps its own more specific route at `/api/auth/[...all]`, which Next.js matches first, so it is never touched by the catch-all. New API routes go in `src/server/api/routes/` and get `.use()`d into the `api` Elysia instance.

Protected routes use the `authPlugin` macro (`src/server/api/auth-plugin.ts`): add `authenticated: true` to a route's config to resolve the better-auth session from request headers and get typed `user`/`session` in the handler; missing sessions auto-401. See `src/server/api/routes/todos.ts` for the pattern (list/create/patch/delete, each scoped to `user.id`).

### Realtime WebSockets

Next.js route handlers cannot upgrade to WebSocket, so the realtime Elysia app (`src/server/realtime/`) runs as its own Bun process (`bun run dev:realtime`, port `REALTIME_PORT`, default 3001). It shares the better-auth instance: the browser sends the session cookie on the upgrade request (same host, different port), an instance-level `.resolve()` rejects the handshake with 401 when there is no session (plus a 403 origin check), and `ws.data.user` is typed in the ws handlers. Wire types live in `src/lib/realtime.ts`, shared by server and client. The client (`src/components/realtime/live-panel.tsx`) reads `process.env.NEXT_PUBLIC_REALTIME_URL` directly — it cannot import `src/lib/env.ts` (see below). Note: the HTTP API and realtime server are separate processes, so HTTP routes can't publish to WS clients without a broker.

### Env validation

`src/lib/env.ts` splits `serverSchema` (DB url, auth secret, etc.) from `clientSchema` (`NEXT_PUBLIC_*`). Import `env` only from server code — it will throw at build/runtime if imported into a client component, since server vars are undefined there.

### TanStack Form

`src/components/forms/form.tsx` uses the `createFormHook` composition pattern: `TextField` and `SubmitButton` are bound to form context once via `createFormHookContexts()` and reused across every form (see `sign-in-form.tsx` / `sign-up-form.tsx`). Zod schemas plug directly into `validators: { onChange: schema }` since Zod implements Standard Schema — no adapter needed. Add new shared field components to this file rather than duplicating field markup per form.

### Testing

`bunfig.toml` preloads `src/test/setup.ts` for every `bun test` run: registers happy-dom globals, extends `expect` with jest-dom matchers (typed via `src/test/matchers.d.ts`), and runs RTL `cleanup` after each test. Module mocks use `mock.module(...)`; import the component under test *after* the `mock.module` calls (see `sign-in-form.test.tsx`, which does the import inside `beforeAll`).

### shadcn/ui

`components.json` is configured (new-york style, neutral base color). Install more components with `bunx shadcn@latest add <component>`.

### Fonts

The layout uses a system font stack to stay offline-friendly. To use `next/font/google`, add it back in `src/app/layout.tsx` (requires network access at build time).
