# 5me Dev Guides (Vercel + Next.js 15 + Prisma 5 + Postgres)

Last updated: 2025-12-25

## Stack (5me)
- **Next.js**: 15.x (App Router + Turbopack)
- **Prisma ORM**: 5.22.x
- **Auth**: NextAuth v5 beta (Google OAuth, domain-restricted)
- **Database**: PostgreSQL via `PRISMA_CORE`
- **UI**: Tailwind CSS + custom `components/ui/` (not shadcn)
- **Background jobs**: Not yet implemented (Inngest docs kept for future)

## What’s inside
- `01-nextjs.md` — Next.js 16 best practices (App Router)
- `02-typescript.md` — TS rules for clean, safe code
- `03-prisma-postgres.md` — schema, migrations, pooling, performance
- `04-authjs.md` — auth architecture + session hardening
- `05-tailwind-shadcn.md` — UI consistency rules
- `06-inngest.md` — job patterns, idempotency, retries
- `07-vercel-deploy.md` — deploy, envs, preview safety
- `08-testing-quality.md` — tests, linting, CI gates
- `09-security.md` — security baseline checklist
- `10-repo-structure.md` — recommended folder structure
- `11-env-config.md` — env rules + secrets hygiene
- `vscode/` — optional VS Code workspace settings/snippets

## Non-negotiables
- No direct DB writes from client components.
- Every mutation is authenticated + authorized + validated (Zod).
- Every background job is idempotent (safe to retry).
- Prefer “server-first” Next.js (server components/actions) and keep client JS minimal.
