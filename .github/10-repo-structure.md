# 5me Repo Structure

```
.
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # Protected admin routes (route group)
│   │   │   ├── layout.tsx    # Auth check + nav shell
│   │   │   ├── dashboard/
│   │   │   ├── companies/
│   │   │   ├── feedback/
│   │   │   └── settings/
│   │   ├── api/              # RESTful route handlers
│   │   │   ├── companies/
│   │   │   ├── feedback/
│   │   │   └── users/
│   │   ├── login/            # Public auth pages
│   │   ├── reviews/[companySlug]/[locationSlug]/  # Public review flow
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx     # React Query + SessionProvider
│   ├── components/
│   │   ├── ui/               # Button, Card, Input, Modal, Table
│   │   └── layout/           # DashboardNav, DashboardHeader
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config + helpers
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── utils.ts          # cn(), formatDate(), etc.
│   ├── services/
│   │   ├── companies.ts      # Server-side (direct Prisma)
│   │   ├── company.service.ts # Client-side (Axios to API)
│   │   └── ...               # Pattern: .ts=server, .service.ts=client
│   └── types/
│       └── index.ts          # All TypeScript interfaces
├── prisma/
│   └── schema.prisma
├── .github/                  # Dev guides + copilot instructions
├── public/
└── package.json
```

## Import rules
- Use path alias: `@/` → `src/`
- Server services (`.ts`) use Prisma directly → import in API routes only
- Client services (`.service.ts`) use Axios → import in `'use client'` components
- UI components import from barrel: `import { Button } from '@/components/ui'`

## Service layer pattern

**Server-side** (`companies.ts`):
```typescript
import prisma from '@/lib/prisma';

export async function getAllCompanies() {
  return prisma.company.findMany({ take: 100 });
}
```

**Client-side** (`company.service.ts`):
```typescript
import api from './api';

export const companyService = {
  async getCompanies() {
    const response = await api.get('/companies');
    return response.data;
  }
};
```
