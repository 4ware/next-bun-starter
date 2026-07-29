# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install                        # install deps
bun run docker:up                  # start Postgres (dev + e2e) and Redis via docker compose
bun run docker:down                # stop them
bun run dev                        # Next.js dev server (Turbopack) on Node
bun run dev:realtime               # standalone WebSocket server (port 3001, --watch)
bun --bun next dev                 # dev server on the Bun runtime instead of Node
bun run build / start              # production build / serve
bun run typecheck                  # tsc --noEmit
bun run lint                       # next lint

bun test                           # run unit test suite (src/ only, see bunfig.toml)
bun run test:watch                 # watch mode
bun test src/lib/validators/auth.test.ts   # run a single test file
bun test -t "test name"            # filter by test name

bun run test:e2e                   # Playwright e2e suite (needs Postgres, see below)
bun run test:e2e:ui                # Playwright UI mode
bunx playwright test e2e/todos.e2e.ts      # run a single e2e spec

bun run db:generate                # generate SQL migration from schema changes
bun run db:migrate                 # apply migrations
bun run db:push                    # push schema directly (skip migration files)
bun run db:studio                  # Drizzle Studio
```

Copy `.env.example` to `.env` before running anything that touches the DB or auth (`DATABASE_URL`, `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`).

## Architecture

Full-stack TypeScript app: Next.js 16 (App Router) + React 19, Bun as package manager/test runner, Elysia as the API layer, Drizzle ORM + Postgres, better-auth, Tailwind v4 + shadcn/ui, TanStack Form + Query + Zod 4.

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

Route validation uses **zod, not TypeBox**: Elysia 1.4 accepts Standard Schema validators directly in `body`/`params`, and handlers receive the *parsed* zod output (unknown keys stripped). Todo schemas live in `src/lib/validators/todos.ts` (including `z.file()` for the image upload and the non-empty-patch refine). The global `onError` in `src/server/api/index.ts` normalizes validation failures to `{ error: string }` (422), reading zod's `message` (with a fallback to TypeBox's `summary`).

### Realtime WebSockets

Next.js route handlers cannot upgrade to WebSocket, so the realtime Elysia app (`src/server/realtime/`) runs as its own Bun process (`bun run dev:realtime`, port `REALTIME_PORT`, default 3001). It shares the better-auth instance: the browser sends the session cookie on the upgrade request (same host, different port), an instance-level `.resolve()` rejects the handshake with 401 when there is no session (plus a 403 origin check), and `ws.data.user` is typed in the ws handlers. Wire types live in `src/lib/realtime.ts`, shared by server and client. The client (`src/components/realtime/live-panel.tsx`) reads `env.NEXT_PUBLIC_REALTIME_URL` from `src/lib/env.ts`. Note: the HTTP API and realtime server are separate processes, so HTTP routes can't publish to WS clients without a broker.

### Env validation

`src/lib/env.ts` uses `@t3-oss/env-nextjs` (`createEnv` with `server` / `client` / `shared` sections, zod schemas). The single `env` export is safe to import anywhere: client components can read `NEXT_PUBLIC_*` and `NODE_ENV`, while touching a server var from the client throws a descriptive error. New `NEXT_PUBLIC_*` vars must be added to both the `client` schema and `experimental__runtimeEnv` (Next.js inlines them at build time). `SKIP_ENV_VALIDATION=1` skips validation (e.g. for CI builds without secrets).

### TanStack Query

`src/components/providers.tsx` wraps the app in a `PersistQueryClientProvider` (mounted in the root layout, inside `<Providers>`): the query cache is persisted to localStorage (24h maxAge, matching `gcTime`), so reloads render cached data instantly and refetch in the background. `SignOutButton` clears both the in-memory and persisted cache so the next account never sees stale data. The QueryClient's `QueryCache`/`MutationCache` `onError` handlers toast every failed query/mutation via sonner, so components don't handle request errors individually. Client requests go through `request()` in `src/lib/api.ts`, which throws the API's normalized `{ error }` message on non-2xx responses. See `src/components/todos/todo-panel.tsx` for the pattern (`useQuery` for the list, `useMutation` with an optimistic update + rollback for toggling); shared query keys/types live in `src/lib/todos.ts`. The dashboard server component prefetches todos by calling the Elysia app in-process (`api.handle` with the request headers) and hydrates them via `HydrationBoundary`, so the panel never shows a loading state on first paint. Tests render components inside `<Providers>` to get a fresh QueryClient per render (and clear `localStorage` between tests).

### TanStack Form

`src/components/forms/form.tsx` uses the `createFormHook` composition pattern: `TextField` and `SubmitButton` are bound to form context once via `createFormHookContexts()` and reused across every form (see `sign-in-form.tsx` / `sign-up-form.tsx`). Zod schemas plug directly into `validators: { onChange: schema }` since Zod implements Standard Schema — no adapter needed. Add new shared field components to this file rather than duplicating field markup per form.

### Testing

`bunfig.toml` preloads `src/test/setup.ts` for every `bun test` run: registers happy-dom globals, extends `expect` with jest-dom matchers (typed via `src/test/matchers.d.ts`), and runs RTL `cleanup` after each test. Module mocks use `mock.module(...)`; import the component under test *after* the `mock.module` calls (see `sign-in-form.test.tsx`, which does the import inside `beforeAll`).

### i18n (next-intl)

Locales `en` (default, unprefixed) and `de` (`/de/dashboard`), defined in `src/i18n/routing.ts` (`localePrefix: "as-needed"`). `src/proxy.ts` (Next 16's middleware) runs next-intl's locale detection/redirects; its matcher excludes `/api`, `/picture`, internals and files. All pages live under `src/app/[locale]/`; messages in `messages/{en,de}.json`. The language switcher (`src/components/language-switcher.tsx`, fixed top-right in the layout) links the current path in each locale. Client components use `useTranslations` (provider in the `[locale]` layout); navigation goes through `@/i18n/navigation` (`Link`, `useRouter`, `redirect`) — never `next/link`/`next/navigation` for user-facing routes. Zod validators are factories (`createSignInSchema(t)`) with English defaults.

**cacheComponents caveat**: next-intl's request-bound APIs (`getTranslations`, `getMessages`, `requestLocale`) resolve via `headers()` and are forbidden in `"use cache"` scopes — server components instead use `createTranslator({ locale, messages: await loadMessages(locale) })` with the cached loader in `src/i18n/messages.ts`, and `src/i18n/request.ts` is deliberately static (never reads `requestLocale`). Pages follow a split pattern: uncached default export awaits `params`, passes `locale` to a `"use cache"` content/shell component, with dynamic session parts slotted in as Suspense children. Unit tests wrap components in `IntlWrapper` (`src/test/intl.tsx`, English messages) and mock `@/i18n/navigation` instead of `next/navigation`.

### Cache Components (Next 16)

`cacheComponents: true` is enabled in `next.config.ts`: pages are dynamic by default, and any uncached IO (`headers()`, session, db) must render inside a `<Suspense>` boundary — `/` and `/dashboard` are Partial Prerender routes (static shell + streamed session content in a Suspense'd server component). `src/server/todos-cache.ts` is the `"use cache"` example: `getTodosForUser(userId)` caches per user (arg is part of the cache key), tagged via `cacheTag` with `cacheLife("hours")`. The Elysia todo mutation routes revalidate it with `revalidateTag(tag, { expire: 0 })` — `{ expire: 0 }` gives read-your-writes (immediate expiry); the string profiles like `"max"` are serve-stale-while-revalidate and will serve stale data on the next request. The dashboard prefetches from this cached function instead of hitting the API. E2E note: dev-mode PPR streaming leaves a hidden duplicate of suspended content in the DOM, so todo assertions use `getByRole` (role queries skip hidden elements).

### Todo image uploads (react-uploady)

Todos can carry one image. Storage is split: the `uploads` table holds metadata only (id, owner, content type), the bytes live on the file system under `UPLOADS_DIR` (default `.uploads/`, gitignored; tests point it at a tmpdir via `src/test/setup.ts`), named by upload id — see `src/server/storage.ts` (note: files are instance-local; use a shared volume or object storage when scaling out). `todos.image_id` is a nullable FK (`set null`). `POST /api/todos/:id/image` accepts multipart (`z.file()` validated to jpeg/png/webp/gif, max 5 MB), inserts the metadata row, writes the file, points the todo at it, deletes the replaced upload (row + file), and revalidates the todos cache tag; deleting a todo also deletes its upload row + file. `GET /api/uploads/:id` checks ownership/content type in the DB, reads the bytes from disk (404 if either is missing) and serves them with `Cache-Control: private, immutable` (upload ids are immutable — replacing creates a new row). Client: `src/components/todos/todo-panel.tsx` wraps the list in `<Uploady>` with a per-row `asUploadButton` trigger (per-todo `destination`); a global `useItemFinishListener` invalidates the todos query + toasts, `useItemErrorListener` surfaces the API's `{ error }`. While an upload is in flight a progressbar replaces the row's attach button: `useBatchStartListener` maps upload items to their todo via the destination URL, `useItemProgressListener` feeds a `todoId → percent` state (e2e observes it by delaying the route with `page.route`). Thumbnails use plain `<img>`, not next/image — the route needs the session cookie, which the image optimizer would not forward.

### Cached image route

`src/app/picture/[size]/route.ts` serves a generated PNG (`src/server/picture.ts`, dependency-free encoder) at the sizes in `PICTURE_SIZES`. It lives outside `/api` so the Elysia catch-all doesn't own it. With cacheComponents, `generateStaticParams` + no dynamic IO makes it prerendered — at runtime the PNG responses live in the incremental cache (Redis in production, keys `next-cache:/picture/*`). Segment configs like `dynamic`/`dynamicParams` are **not allowed** with cacheComponents; unknown sizes 404 via an in-handler check. The dashboard renders it at all sizes with `next/image` (the optimizer fetches this route as its source). E2E note: like the todos assertions, interactions use `getByRole` queries because dev PPR leaves hidden DOM duplicates that `getByLabel`/`getByText` would match.

### Redis cache handler

`cache-handler.cjs` (project root, plain CommonJS — Next require()s it at runtime, so it reads `REDIS_URL` from `process.env` directly) backs Next's incremental cache with Redis: prerendered/ISR pages, the fetch data cache, and `revalidateTag`/`revalidatePath` (soft tags handled via per-tag revalidation timestamps). It is wired in `next.config.ts` for `NODE_ENV=production` only (`cacheMaxMemorySize: 0` disables the in-memory LRU); dev and tests use Next's default cache. When Redis is down it degrades to cache misses instead of failing requests. Unit tests: `src/server/cache-handler.test.ts` (in-memory fake of the node-redis client).

### E2E tests (Playwright)

Specs live in `e2e/` (named `*.e2e.ts` so `bun test` never picks them up; `bunfig.toml` additionally restricts bun test to `src/`). `playwright.config.ts` boots the Next dev server itself with env from `e2e/env.ts` — real env vars win, fallbacks target the throwaway `db-test` compose service on port `55432` (`bun run docker:up`; tmpfs-backed, so restarting the service wipes it). `e2e/global-setup.ts` runs `drizzle-kit push` against that DB before the suite. `auth.setup.ts` is a Playwright setup project that signs up a fresh user per run and saves its session to `e2e/.auth/user.json`; `todos.e2e.ts` reuses that storage state, while `auth.e2e.ts` drives sign-up/sign-in/sign-out itself with unique emails per test.

### shadcn/ui

`components.json` is configured (new-york style, neutral base color). Install more components with `bunx shadcn@latest add <component>`.

### Fonts

The layout uses a system font stack to stay offline-friendly. To use `next/font/google`, add it back in `src/app/layout.tsx` (requires network access at build time).
