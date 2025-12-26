# Env Config Rules (Vercel + Local)

## Use Zod validation for env at startup
- Fail fast if required env vars are missing or malformed.

## Separate envs
- `.env.local` (never committed) for dev.
- Vercel env vars for preview/staging/prod.
- Optional `.env.example` committed for documentation only.

## Naming
- Server-only vars: no `NEXT_PUBLIC_` prefix.
- Client-exposed vars: `NEXT_PUBLIC_` and assume they are public forever.

## 5me env vars
- `PRISMA_CORE` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `NEXTAUTH_URL` — Base URL for auth callbacks (production)

## Rotation
- Rotate `AUTH_SECRET` on schedule or after key personnel changes.
- Never reuse staging secrets in production.
