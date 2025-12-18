# 5me React Application - Copilot Instructions

## Project Overview
5me is a review management platform built with React, TypeScript, and Vite. It's designed to help businesses collect, manage, and display customer reviews from multiple sources.

## Architecture

### Frontend Stack
- React 19 with TypeScript
- Vite for development and builds
- Tailwind CSS for styling
- React Router for navigation
- React Query for server state management
- Axios for API calls

### Project Structure
- `/src/components/ui` - Reusable UI primitives (Button, Input, Card, StarRating)
- `/src/components/layout` - Layout components (Sidebar, Header, DashboardLayout, AuthLayout)
- `/src/pages` - Page components organized by feature
- `/src/services` - API service modules
- `/src/hooks` - Custom React hooks
- `/src/context` - React Context providers (Auth)
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions

### Key Patterns
- Use path aliases (`@/` maps to `src/`)
- Type-only imports for TypeScript types (`import type { ... }`)
- Service layer pattern for API calls
- Context + hooks pattern for auth state
- Component composition with forwardRef for UI primitives

## Coding Standards

### TypeScript
- Use strict mode
- Always define proper types for props and state
- Use type-only imports when importing only types
- Prefer interfaces for object shapes, types for unions

### React
- Functional components with hooks
- Use React Query for data fetching
- Keep components small and focused
- Extract reusable logic into custom hooks

### Styling
- Use Tailwind CSS utility classes
- Use the `cn()` utility for conditional classes
- Follow the color scheme defined in CSS variables
- Keep consistent spacing and sizing

### File Naming
- React components: PascalCase (e.g., `DashboardPage.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Services: camelCase with `.service.ts` suffix
- Types: export from `index.ts` in types folder

## API Integration
- Base URL configured via `VITE_API_URL` environment variable
- Auth tokens stored in localStorage
- Automatic token refresh on 401 responses
- Will integrate with hub.actuatemedia.com backend

## Features to Implement
- [ ] Review aggregation from Google, Facebook, Yelp
- [ ] Review request email/SMS automation
- [ ] Embeddable widget builder
- [ ] Multi-location support
- [ ] Analytics and reporting
- [ ] Hub integration for centralized management
