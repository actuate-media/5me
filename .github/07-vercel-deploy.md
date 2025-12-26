# Vercel Deploy — Best Practices

## Environments
- **Preview**: every PR gets a preview deployment.
- **Production**: main branch only.
- **Development**: local only (or a shared dev env if needed).

## Database strategy
- Each preview should NOT point at production DB.
- Use:
  - a shared staging DB, OR
  - ephemeral DB per preview (if your provider supports it), OR
  - feature-flag DB writes off in preview.

## Secrets & env vars
- All secrets in Vercel env config, never in repo.
- Use `@t3-oss/env-nextjs` or a Zod env schema to validate required vars at boot.

## Prisma in serverless
- Ensure connection pooling (provider-level or PgBouncer).
- Keep Prisma client as a singleton module.

## Observability
- Enable Vercel logs.
- Add error tracking (Sentry or similar).
- Include request IDs in logs.

## Performance
- Use ISR/revalidate where appropriate.
- Use Edge only where it helps and where dependencies support it.

## Rollbacks
- Tag deployments.
- If prod breaks, rollback first, diagnose second. Heroics are for Marvel, not release day.
