# Tailwind + UI Components — Best Practices

## Goals
- Consistent, fast UI with minimal custom CSS.
- Accessibility by default.

## 5me Approach
5me uses **custom UI components** in `src/components/ui/` (not shadcn). Components follow the `forwardRef` pattern with variant/size props.

## Rules
- Import from barrel: `import { Button, Card, Input } from '@/components/ui'`
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Keep design tokens centralized via Tailwind config
- Don't scatter ad-hoc hex colors in components

## Component guidelines
- `src/components/ui/` — primitives (Button, Card, Input, Modal, Table, etc.)
- `src/components/layout/` — layout components (DashboardNav, DashboardHeader)
- Keep components:
  - pure (props in, UI out)
  - minimal side effects
  - testable

## Forms
- Use react-hook-form + zod (optional but recommended).
- Show inline validation + clear empty states.

## Accessibility
- Keyboard nav works everywhere.
- Labels for every input.
- Focus states visible.
- Use `aria-*` attributes when needed.

## Performance
- Avoid rendering giant tables without virtualization.
- Use `next/dynamic` for heavy components.

## Styling discipline
- Prefer:
  - `cn()` helper for class merging
  - variant-based styling for buttons/badges
- Avoid:
  - inline styles unless truly dynamic
  - one-off CSS files
