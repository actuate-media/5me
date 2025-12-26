# Inngest — Best Practices (Workflows + Background Jobs)

> **Note**: 5me does not currently use Inngest. These patterns are documented for future implementation of background jobs (email automation, report generation, etc.).

## Principles
- **Idempotent by default**: every function must be safe to retry.
- **Deterministic steps**: each step has a stable name/key.
- **Small steps**: avoid one mega-step that does everything.

## What runs in Inngest
Good candidates:
- crawling / enrichment
- sending emails/webhooks
- syncing to external systems
- report generation
- long-running imports

Bad candidates:
- user-facing request/response (keep those in Next.js)

## Patterns
- Use event-driven workflows:
  - `user.created` -> provision tenant -> welcome email -> initial crawl job
- Use “step.run” blocks to:
  - isolate side effects
  - control retries and timeouts

## Retries & failure handling
- Explicit retry strategy:
  - transient errors retry
  - validation errors don’t retry
- Dead-letter / alerting:
  - notify when a job fails N times
- Store failure metadata for debugging.

## Idempotency keys
- For each event, derive a stable idempotency key:
  - `${event.name}:${event.data.resourceId}:${event.data.version}`
- Before writing, check if work already completed.

## Observability
- Correlate logs:
  - include `eventId`, `functionId`, `stepName`, `accountId`
- Emit “job started / job completed” events for dashboards.

## Security
- Never accept raw public triggers without auth/signature.
- If Next.js triggers a job, it should do so server-side and be authorized.

## Local dev
- Use Inngest dev server/CLI.
- Keep `.env.example` updated with required job secrets.
