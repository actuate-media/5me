# 5me - Review Management Platform

A modern React-based review management platform for collecting, managing, and displaying customer reviews. This project is a React port of the 5me.io WordPress plugin, designed to integrate with [hub.actuatemedia.com](https://hub.actuatemedia.com) for centralized management.

## Features

- **Dashboard** - Overview of review performance with key metrics
- **Review Management** - View, filter, and respond to reviews from multiple sources (Google, Facebook, Yelp)
- **Review Requests** - Send review request emails/SMS to customers
- **Embeddable Widgets** - Create customizable review widgets for your website
- **Multi-location Support** - Manage reviews across multiple business locations
- **Hub Integration** - Connects to hub.actuatemedia.com for centralized management

## Tech Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Lucide Icons** - Beautiful icons

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Sidebar, Header, etc.)
│   └── ui/             # UI primitives (Button, Input, Card, etc.)
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── auth/           # Login, Register pages
│   ├── dashboard/      # Dashboard page
│   ├── reviews/        # Reviews management
│   └── widgets/        # Widget builder
├── router/             # React Router configuration
├── services/           # API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/actuate-media/5me.git
   cd 5me
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `http://localhost:3001/api` |

For production, set `VITE_API_URL` to `https://hub.actuatemedia.com/api/5me`

## Hub Integration

This application is designed to work with [hub.actuatemedia.com](https://hub.actuatemedia.com) as the backend API. The hub provides:

- User authentication and authorization
- Business/location management
- Review aggregation from Google, Facebook, Yelp
- Review request automation
- Widget configuration storage

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [5me.io](https://5me.io) - Original WordPress plugin version
- [hub.actuatemedia.com](https://hub.actuatemedia.com) - Backend management hub
- [Actuate Media](https://www.actuatemedia.com) - Parent company
