# Next.js 15 (App Router) — Best Practices

## Architecture defaults
- Use **App Router** (`/app`) only. No `/pages` unless migrating legacy.
- Prefer **Server Components** by default; add `"use client"` only when needed (forms with local state, drag/drop, charts, etc.).
- Put all mutations behind:
  - **Server Actions** (`"use server"`) for form-driven workflows, OR
  - **Route Handlers** (`/app/api/**/route.ts`) for REST-like / webhooks / 3rd-party callbacks.

## Data fetching & caching (avoid surprise staleness)
- Assume everything is cached unless you say otherwise.
- For dynamic dashboards/admin panels:
  - Use `export const dynamic = "force-dynamic"` on routes that must be fresh.
  - Or use `fetch(..., { cache: "no-store" })` for always-fresh calls.
- For pages that can be cached:
  - Prefer `revalidate = <seconds>` to balance speed + freshness.
- After mutations:
  - Call `revalidatePath("/...")` or `revalidateTag("...")` (tag your fetches).

## Server Actions: rules
- Validate input with Zod at the boundary (the action).
- Never trust client-provided IDs for authorization. Re-check ownership server-side.
- Return typed results `{ ok: true, data } | { ok: false, error }`.
- Don’t throw for normal validation failures; throw for “this should never happen”.

## Route Handlers: rules
- Use for webhooks, file upload signatures, third-party callbacks.
- Verify signatures (Stripe, etc.) in the handler before parsing JSON when required.
- Set explicit runtime:
  - Use **Node runtime** for Prisma DB access unless you know Edge is supported.
- Rate-limit public endpoints (Upstash/Redis or Vercel’s managed KV).

## Error handling
- Add `app/error.tsx` and per-segment `error.tsx` for graceful failures.
- Add `app/not-found.tsx`.
- Log server errors with structured logs (requestId, userId, route, errorName).
- Never leak stack traces to clients.

## Performance
- Avoid heavy client bundles:
  - Keep charts, editors, and big libraries behind dynamic import.
- Use image optimization (`next/image`) and set sizes.
- Use `next/font` for fonts (no external blocking loads).
- Keep your Prisma queries tight: select only the fields you need.

## Security
- Default to server-side auth checks.
- Set CSP (at least in prod) and avoid inline scripts unless hashed.
- For admin tools, consider requiring re-auth for sensitive actions.

## Folder conventions (5me)
- `src/app/(dashboard)/...` — authenticated admin routes
- `src/app/reviews/...` — public review flow
- `src/app/api/...` — route handlers (RESTful, nested by resource)
- `src/lib/...` — auth.ts, prisma.ts, utils.ts
- `src/components/ui/` — UI primitives (Button, Card, Input, etc.)
- `src/components/layout/` — DashboardNav, DashboardHeader
- `src/services/...` — server-side (.ts) + client-side (.service.ts)

## Pitfalls to avoid
- Importing server-only modules into client components.
- Doing data fetching in client components when server components can do it.
- Relying on implicit caching and wondering why data is stale.
