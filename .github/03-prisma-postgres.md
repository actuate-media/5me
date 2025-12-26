# Prisma 5 + Postgres — Best Practices

## Prisma client lifecycle (serverless safe)
- Create **one** PrismaClient instance per process (module singleton).
- In dev with HMR, guard against creating many clients (globalThis pattern).

## Connection pooling (critical on Vercel)
- Use a pooler (Neon/Supabase built-in pooling, PgBouncer, etc.).
- Avoid opening too many connections per request:
  - Don’t instantiate PrismaClient inside request handlers/actions.

## Schema design
- Use `@id @default(cuid())` or `uuid()`; pick one and stick with it.
- Add `createdAt`, `updatedAt` on most tables.
- Use soft delete only if you truly need it; otherwise hard delete + audit log.

## Migrations
- Treat migrations as code:
  - reviewed in PR
  - applied in CI on a disposable DB
- Use `prisma migrate dev` locally.
- Use `prisma migrate deploy` in production deploy pipeline.

## Query performance
- Prefer `select` over `include` unless you truly need nested graphs.
- Add indexes for:
  - foreign keys used in filters
  - common query filters (status, accountId, createdAt)
- Avoid N+1:
  - fetch in one query or use `include` strategically.

## Transactions
- Use `$transaction` for multi-write operations that must be atomic.
- Keep transactions short.

## Multi-tenant data model (if applicable)
- Every row gets `accountId` (tenant).
- Enforce tenant isolation in every query (helpers that require accountId).
- Optional: database-level RLS if you want belt + suspenders.

## Seed/data
- Keep `prisma/seed.ts` deterministic and safe to re-run.
- Never seed production unless explicitly intended.

## Observability
- Enable Prisma query logging only in dev/troubleshooting.
- For prod, emit metrics (query durations, error rates) without logging PII.

## Postgres hygiene
- Use `timestamptz` for times.
- Store money as integer cents (avoid float).
- Use enums carefully—migrations for enums can be painful; sometimes lookup tables are easier.
