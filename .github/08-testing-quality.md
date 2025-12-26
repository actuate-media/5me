# Testing + Quality Gates

> **Note**: 5me does not currently have tests. This doc outlines the target testing strategy.

## Current quality gates (5me)
```bash
npm run lint         # ESLint
npm run build        # TypeScript + Next.js build check
```

## Target test stack (to implement)
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E: Playwright
- API/route handler tests: direct invocation + test DB

## Quality gates (target CI)
- `npm run lint`
- `npm run typecheck` (add to package.json: `"typecheck": "tsc --noEmit"`)
- `npm test`
- `npm run test:e2e` (nightly if too slow per PR)

## Linting discipline
- ESLint + TypeScript plugin.
- Prettier for formatting (avoid style debates in PRs).

## Database testing
- Use a test DB schema.
- Reset between tests (transactions or truncation).
- Avoid depending on seed data unless fixed and versioned.

## Known failure points
- caching + revalidation bugs
- auth edge cases
- multi-tenant isolation mistakes
Write tests specifically for these.
