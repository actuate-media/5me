# Auth.js (NextAuth v5 / Auth.js) — Best Practices

## Decision: session strategy
- Default: **JWT sessions** for simplicity.
- Use DB sessions if you need:
  - server-side session invalidation
  - device/session management
  - audit trails

## Providers
- Prefer OAuth providers with strong controls (Google, Microsoft).
- For B2B, strongly consider “sign in with Google/Microsoft” + domain allowlist.

## Authorization (the part people forget)
- Authentication = who you are.
- Authorization = what you can do.
- Implement:
  - role-based access control (RBAC) for admin features
  - resource ownership checks for tenant isolation

## Patterns (Next.js App Router)
- Put auth gating in:
  - middleware for coarse “must be logged in”
  - server-side checks for fine-grained permissions

## Security hardening
- Secure cookies:
  - `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` for very sensitive apps)
- Rotate secrets; never commit them.
- Turn on CSRF protections where applicable (Auth.js handles most flows; don’t break it).
- Use short session lifetimes for admin surfaces; require re-auth for destructive actions.

## Auditing
- Log auth events: login, logout, passwordless token usage, failed sign-ins.
- Add “who did what” to sensitive mutations (userId, ip, userAgent).

## Common mistakes to avoid
- Trusting `userId` from the client (don’t).
- Doing authorization in the UI only (that’s cosplay security).
- Leaving “dev” callbacks enabled in prod.
