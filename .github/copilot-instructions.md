# 5me - Review Management Platform

## Architecture Overview
Next.js 16 (App Router + Turbopack) • React 19 • TypeScript • Prisma 5 • PostgreSQL • NextAuth v5 (Google OAuth, `@actuatemedia.com` domain only)

**Data flow**: Company → Location → ReviewSource. Customers visit `/reviews/[companySlug]/[locationSlug]` to rate; ≥4 stars shows review platforms, <4 stars captures private feedback.

## Project Structure
```
src/
├── app/
│   ├── (dashboard)/           # Protected admin routes (route group, 'use client' pages)
│   ├── api/                   # RESTful routes, nested: /companies/[id]/locations/[locationId]
│   ├── reviews/[companySlug]/[locationSlug]/  # Public review flow (Server + Client split)
│   └── login/                 # Public auth
├── components/ui/             # Barrel export: Button, Card, Input, Modal, Table, Badge
├── lib/                       # auth.ts, prisma.ts, utils.ts (cn function)
├── services/                  # Server (.ts) vs Client (.service.ts) — see below
└── types/index.ts             # All TypeScript interfaces
```

## Critical Patterns

### API Routes (Next.js 16 - REQUIRED)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';  // Always add this

interface RouteParams { params: Promise<{ id: string }> }  // Params are Promises!

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;  // Must await
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

### Services Layer (Two Patterns)
| Type | Location | Usage | Example |
|------|----------|-------|---------|
| Server | `services/companies.ts` | Direct Prisma in API routes | `getAllCompanies()` |
| Client | `services/company.service.ts` | Axios to `/api/*` in `'use client'` | `companyService.getCompanies()` |

### Component Pattern
```typescript
// Dashboard pages: 'use client' + fetch from /api
// See: src/app/(dashboard)/companies/page.tsx

// Public review flow: Server Component fetches → passes to Client Component
// See: src/app/reviews/[companySlug]/[locationSlug]/page.tsx → review-flow-client.tsx
```

### UI Components
```typescript
import { Button, Card, Input, Modal } from '@/components/ui';  // Barrel import
import { cn } from '@/lib/utils';  // Tailwind class merging

// Components use forwardRef + variant/size props
<Button variant="primary" size="md" isLoading={loading}>Save</Button>
```

## Database Patterns

```typescript
// ✅ Always limit findMany
await prisma.company.findMany({ take: 100 });

// ✅ Use select for specific fields
await prisma.reviewSource.findMany({ where: { locationId }, select: { id: true, type: true, name: true, url: true }, take: 20 });

// ❌ Never query in loops
for (const id of ids) { await prisma.find... }  // N+1
await prisma.findMany({ where: { id: { in: ids } } });  // GOOD

// Prisma error handling
if (error && typeof error === 'object' && 'code' in error) {
  if (error.code === 'P2002') return 400;  // Unique constraint
  if (error.code === 'P2025') return 404;  // Not found
}
```

## Auth & Security
- Google OAuth only, domain: `@actuatemedia.com`
- Superadmin: `strategize@actuatemedia.com` (hardcoded in `src/lib/auth.ts`)
- User upsert on login, session includes `user.role`: `SUPERADMIN | ADMIN | USER`
- Middleware protects: `/dashboard`, `/companies`, `/feedback`, `/widgets`, `/settings`
- **Every API route**: check `await auth()` first, return 401 if no session

## Pre-Deployment Checklist
Before deploying, verify:
```bash
npm run build         # Must pass without errors
npm run lint          # No lint errors
npx prisma validate   # Schema valid
```

**Manual checks** (see [AI_CODE_QUALITY_ASSURANCE.md](AI_CODE_QUALITY_ASSURANCE.md)):
- [ ] No `console.log()` in production code
- [ ] All API routes have `export const dynamic = 'force-dynamic'`
- [ ] All `findMany()` calls have `take` limits
- [ ] No hardcoded URLs or secrets
- [ ] Database migrations applied: `npm run db:migrate:deploy`

## Vercel Deployment
**Required env vars** (set in Vercel dashboard):
- `PRISMA_CORE` - PostgreSQL connection (use pooled URL from Neon/Supabase)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET` - generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - production URL (e.g., `https://5me.vercel.app`)

**Build settings**: Auto-detected. `npm run build` runs `prisma generate && next build`.

## Commands
```bash
npm run dev           # Start with Turbopack (port 3000)
npm run build         # prisma generate && next build
npm run db:migrate    # Create migration (prompts for name)
npm run db:push       # Push schema without migration
npm run db:studio     # Prisma Studio GUI
npm run db:seed       # Run prisma/seed.ts
npm run db:reset      # Reset DB + seed (destructive!)
```

## Conventions
- Path alias: `@/` → `src/`
- Type imports: `import type { Company } from '@/types'`
- Prisma connection: `PRISMA_CORE` env var
- Slugs: Company globally unique; Location unique within company (`@@unique([companyId, slug])`)
- Icons: `lucide-react` (e.g., `Building2`, `MapPin`, `Plus`)

## Key Files Reference
| Pattern | Reference File |
|---------|----------------|
| API route structure | [src/app/api/companies/[id]/route.ts](src/app/api/companies/[id]/route.ts) |
| Server service | [src/services/companies.ts](src/services/companies.ts) |
| Client service | [src/services/company.service.ts](src/services/company.service.ts) |
| UI component | [src/components/ui/Button.tsx](src/components/ui/Button.tsx) |
| Server→Client split | [src/app/reviews/[companySlug]/[locationSlug]/page.tsx](src/app/reviews/[companySlug]/[locationSlug]/page.tsx) |

> **Deep dives**: See `.github/` docs for [NextJS](01-nextjs.md), [TypeScript](02-typescript.md), [Prisma](03-prisma-postgres.md), [Auth](04-authjs.md), [Security](09-security.md)
