# Security Baseline (Web App)

## Authentication & sessions
- Secure cookies, short-lived sessions for admin.
- Protect against CSRF where relevant.
- Rate-limit login endpoints.

## Authorization
- Enforce tenant isolation in the server layer, not the UI.
- Centralize permission checks:
  - `requireRole(user, "admin")`
  - `requireAccountAccess(user, accountId)`

## Input validation
- Validate all inputs with Zod at the boundary.
- Never pass raw user strings into DB queries without validation.

## Secrets
- No secrets in git.
- Rotate secrets on staff changes.
- Separate staging/prod credentials.

## Webhooks
- Verify signature.
- Reject old timestamps.
- Idempotency on delivery.

## Logging
- Don’t log PII or secrets.
- Use structured logs.
- Keep audit logs for destructive actions.

## Dependencies
- Keep deps updated.
- Run `pnpm audit` or equivalent in CI.
- Patch critical Next.js security updates promptly (don’t “next week” this).

## File uploads
- Use object storage + pre-signed URLs.
- Scan files if user-supplied and you redistribute.

## Headers
- Set:
  - CSP (production)
  - HSTS
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
