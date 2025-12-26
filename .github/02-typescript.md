# TypeScript — Best Practices (Platform Code)

## Compiler stance
- Turn on strictness. If you can’t do it globally today, do it by folder with project references.
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true` (if you can handle it)
  - `noImplicitOverride: true`

## Rules of thumb
- Prefer **types at boundaries** and **inference inside**.
- No `any` in app code. Only allowed in:
  - generated files
  - vendor shims
  - very small “escape hatch” adapters with a TODO + ticket.

## Validation
- All external inputs get validated with Zod:
  - request bodies
  - query strings
  - server actions inputs
  - env vars

## Error typing
- Don’t do `catch (e) { return e.message }` blindly.
- Normalize errors:
  - `toAppError(err): { code, message, cause? }`
- Log `cause` server-side; return user-safe `message` client-side.

## Naming
- `PascalCase` for React components and classes.
- `camelCase` for functions/vars.
- `SCREAMING_SNAKE_CASE` only for constants that are truly global and static.

## Async
- Never ignore promises. Use ESLint `@typescript-eslint/no-floating-promises`.
- Use `Promise.all` for independent IO.

## “no footguns” linting
- Enforce:
  - `no-explicit-any`
  - `consistent-type-imports`
  - `no-misused-promises`
  - `no-unnecessary-type-assertion`

## Type-safe routing
- Centralize route builders to avoid stringly-typed routes.
- Example: `routes.project(id)` returns `/projects/${id}`.

## DTOs
- Define DTOs once; don’t re-define shapes in multiple places.
- Prefer `z.infer<typeof Schema>` so validation + typing stay in sync.
