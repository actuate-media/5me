# 5me - Review Management Platform

A Next.js-based review management platform for collecting customer reviews and routing feedback. Customers visit a branded review page, rate their experience, and are either directed to public review platforms (≥4 stars) or captured internally (<4 stars).

## Features

- **Company & Location Management** - Multi-tenant support with Company → Location → ReviewSource hierarchy
- **Smart Review Routing** - High ratings → external platforms (Google, Facebook, Yelp, etc.), low ratings → private feedback
- **Dashboard Analytics** - Track review clicks, feedback submissions, and performance metrics
- **Embeddable Widgets** - Create customizable review widgets for websites
- **Hub Integration** - Connects to hub.actuatemedia.com for centralized management

## Tech Stack

- **Next.js 15** - App Router with Turbopack
- **React 19** - Modern React with Server Components
- **TypeScript** - Strict type-safe development
- **Prisma 5** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **NextAuth v5** - Google OAuth authentication (`@actuatemedia.com` domain)
- **Tailwind CSS 4** - Utility-first styling
- **Vercel** - Deployment platform

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/       # Protected admin routes (route group)
│   ├── api/               # RESTful API routes
│   ├── login/             # Public auth pages
│   └── reviews/           # Public review flow
├── components/
│   ├── ui/                # UI primitives (Button, Card, Modal, etc.)
│   └── layout/            # Dashboard layout components
├── lib/                   # Core utilities (auth, prisma, utils)
├── services/              # Data access layer
└── types/                 # TypeScript definitions
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Google OAuth credentials

### Installation

```bash
git clone https://github.com/actuate-media/5me.git
cd 5me
npm install
```

### Environment Setup

Create `.env.local`:
```env
# Database
PRISMA_CORE="postgresql://..."

# Auth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
AUTH_SECRET="..."  # Generate with: openssl rand -base64 32

# Optional
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### Development

```bash
npm run dev          # Start with Turbopack (port 3000)
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed sample data
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create new migration |
| `npm run db:push` | Push schema (no migration) |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | Reset DB + seed (destructive) |

## Deployment

Deployed on Vercel. See [.github/07-vercel-deploy.md](.github/07-vercel-deploy.md) for deployment configuration.

**Required Environment Variables on Vercel:**
- `PRISMA_CORE` - PostgreSQL connection string (pooled)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `AUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Production URL (e.g., `https://5me.vercel.app`)

## Documentation

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for AI coding agent guidelines and [.github/](.github/) for detailed documentation:

- [NextJS Patterns](.github/01-nextjs.md)
- [TypeScript Guide](.github/02-typescript.md)
- [Prisma + PostgreSQL](.github/03-prisma-postgres.md)
- [Authentication](.github/04-authjs.md)
- [Security Baseline](.github/09-security.md)

## License

Private - Actuate Media

## Related

- [hub.actuatemedia.com](https://hub.actuatemedia.com) - Backend management hub
- [Actuate Media](https://www.actuatemedia.com) - Parent company
