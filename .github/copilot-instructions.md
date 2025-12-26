# 5me - Review Management Platform

## Architecture Overview
Next.js 15 (App Router with Turbopack) + React 19 + TypeScript + Prisma 5 + PostgreSQL. Auth via NextAuth v5 with Google OAuth, restricted to `@actuatemedia.com` domain.

**Data hierarchy**: Company → Location → ReviewSource. Customers visit `/reviews/[companySlug]/[locationSlug]` to rate; ≥4 stars shows review sources, <4 stars captures feedback.

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Protected admin routes (route group)
│   ├── api/                # RESTful API routes, nested by resource
│   ├── login/              # Public auth pages
│   └── reviews/[companySlug]/[locationSlug]/  # Public review flow
├── components/
│   ├── ui/                 # Primitives: Button, Card, Input, Modal, Table
│   └── layout/             # DashboardNav, DashboardHeader
├── lib/                    # auth.ts, prisma.ts, utils.ts
├── services/               # Server-side (.ts) + Client-side (.service.ts)
└── types/index.ts          # All TypeScript interfaces
```

## Critical Patterns

### API Routes (Next.js 15 - Async Params)
Route params are **Promises** in Next.js 15. Always await:
```typescript
interface RouteParams { params: Promise<{ id: string }> }
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

### Services Layer (Two Patterns)
1. **Server-side** (`services/companies.ts`): Direct Prisma calls → used in API routes
2. **Client-side** (`services/company.service.ts`): Axios to `/api/*` → used in `'use client'` components

### Client vs Server Components
- **Server Components**: Dashboard pages (async, call `auth()` directly)
- **Client Components**: Add `'use client'` + separate file (e.g., `review-flow-client.tsx`)
- **error.tsx must be Client Component**, loading.tsx should be Server Component

### UI Components
Import from barrel: `import { Button, Card, Input } from '@/components/ui'`
- `forwardRef` pattern with variant/size props
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes

## Database Patterns

### Query Safety
```typescript
// ✅ Always use take limits on findMany
await prisma.company.findMany({ take: 100 });

// ✅ Use select for specific fields (not include for large relations)
await prisma.company.findMany({ select: { id: true, name: true } });

// ❌ Avoid queries inside loops (N+1 problem)
for (const id of ids) { await prisma.find... }  // BAD
await prisma.findMany({ where: { id: { in: ids } } });  // GOOD
```

### Prisma Error Handling
```typescript
catch (error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2002') return 400; // Unique constraint
    if (error.code === 'P2025') return 404; // Not found
  }
}
```

## Security Checklist
- [ ] All API routes check `await auth()` first
- [ ] User input validated (consider Zod schemas)
- [ ] No `console.log` in production code
- [ ] No hardcoded URLs/secrets
- [ ] `findMany` has `take` limits
- [ ] API routes have `export const dynamic = 'force-dynamic'`

> **See Also:** [CODE_QUALITY.md](.github/CODE_QUALITY.md) for quick reference, [AI_CODE_QUALITY_ASSURANCE.md](.github/AI_CODE_QUALITY_ASSURANCE.md) for comprehensive patterns.

## Dev Guides (`.github/`)
| Doc | Focus |
|-----|-------|
| [01-nextjs.md](.github/01-nextjs.md) | App Router, caching, Server Actions |
| [02-typescript.md](.github/02-typescript.md) | Strict mode, Zod validation |
| [03-prisma-postgres.md](.github/03-prisma-postgres.md) | Schema, migrations, performance |
| [04-authjs.md](.github/04-authjs.md) | NextAuth v5, session handling |
| [05-tailwind-shadcn.md](.github/05-tailwind-shadcn.md) | UI components, styling |
| [09-security.md](.github/09-security.md) | Security baseline |
| [10-repo-structure.md](.github/10-repo-structure.md) | Folder structure |

## Commands
```bash
npm run dev          # Start with Turbopack
npm run build        # prisma generate && next build
npm run db:push      # Push schema (no migration history)
npm run db:migrate   # Create migration
npm run db:studio    # Prisma Studio GUI
```

## Conventions
- Path alias: `@/` → `src/`
- Type imports: `import type { Company } from '@/types'`
- Components: PascalCase (`Button.tsx`)
- Prisma schema: `prisma/schema.prisma`, connection via `PRISMA_CORE` env var
- Slugs: Company globally unique; Location unique within company

## Auth
- Google OAuth only, domain: `@actuatemedia.com`
- Superadmin: `strategize@actuatemedia.com`
- User upsert on login, session includes `user.role`
- Middleware protects: `/dashboard`, `/companies`, `/feedback`, `/widgets`, `/settings`
