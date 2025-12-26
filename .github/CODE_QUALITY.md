# 5me Code Quality Guide

Quick reference for maintaining code quality in the 5me codebase. For comprehensive patterns, see [AI_CODE_QUALITY_ASSURANCE.md](./AI_CODE_QUALITY_ASSURANCE.md).

---

## Before Every Commit

**Quick scan for red flags:**
- [ ] No `console.log()` in production code
- [ ] No `any` types without justification
- [ ] No hardcoded URLs or secrets
- [ ] All `findMany()` calls have `take` limits
- [ ] API routes have `export const dynamic = 'force-dynamic'`

```bash
git diff --cached  # Review your changes
```

---

## API Route Checklist

Every API route must follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';  // Required!

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;  // Next.js 15: params are async!
  
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Business logic...
}
```

---

## Database Query Safety

```typescript
// ✅ Always limit findMany
await prisma.company.findMany({ take: 100 });

// ✅ Use select for specific fields
await prisma.company.findMany({ 
  select: { id: true, name: true, slug: true } 
});

// ❌ Never query inside loops (N+1 problem)
for (const id of ids) { await prisma.find... }  // BAD

// ✅ Use IN clause instead
await prisma.company.findMany({ 
  where: { id: { in: ids } } 
});
```

### Prisma Error Handling

```typescript
catch (error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2002') return 400;  // Unique constraint violation
    if (error.code === 'P2025') return 404;  // Record not found
  }
  return 500;
}
```

---

## Component Patterns

### Server vs Client Components

| Type | Use Case | Pattern |
|------|----------|---------|
| Server | Dashboard pages, data fetching | `async function Page()` + `await auth()` |
| Client | Interactive UI, hooks | `'use client'` + separate file |
| error.tsx | Error boundaries | **Must** be Client Component |
| loading.tsx | Loading states | Should be Server Component |

### UI Imports

```typescript
// Import from barrel
import { Button, Card, Input, Modal } from '@/components/ui';

// Conditional classes
import { cn } from '@/lib/utils';
className={cn(baseStyles, isActive && 'bg-blue-500')}
```

---

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Build for production
npm run lint         # Check for lint errors
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
```

---

## Quick Fixes

**TypeScript errors with Prisma:**
```bash
npm run db:push && npx prisma generate
```

**Build fails locally:**
```bash
rm -rf .next && npm run build
```

**Schema out of sync:**
```bash
npm run db:push
```
