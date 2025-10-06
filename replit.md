# CineWeave - Video Streaming Platform

## Overview

CineWeave is a YouTube-like video streaming platform with enhanced personalization features. The platform enables users to discover, watch, and organize video content while providing unique control mechanisms including Personal Mode (subscription-only feed), Spaces (custom channel collections), and permanent channel blocking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool providing fast Hot Module Replacement (HMR) and optimized production builds
- Wouter for lightweight client-side routing without the overhead of React Router
- Path aliases configured (`@/`, `@shared/`, `@assets/`) for clean imports throughout the codebase

**Rationale:** Vite was chosen over Create React App for significantly faster development builds and better developer experience. Wouter provides routing with minimal bundle size impact.

**UI Component System:**
- Shadcn UI component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with CSS variables enabling runtime theming
- 40+ pre-built accessible components (buttons, dialogs, forms, cards, etc.)
- Dark mode as the default theme with comprehensive color system

**Rationale:** Shadcn UI provides copy-paste components rather than a traditional npm package, giving full control over component code while Radix UI ensures accessibility compliance.

**State Management:**
- Zustand for global application state (personal mode toggle, search queries, current user)
- TanStack Query (React Query) for server state management, caching, and data fetching
- Local component state using React hooks for UI-specific state

**Rationale:** Zustand offers simpler API than Redux with less boilerplate. React Query eliminates manual cache management and provides automatic background refetching.

**Key Application Features:**
- Home page with content-focused layout: top 2-3 rows of videos, followed by "Your Spaces" section, then additional videos (designed for natural scrolling as content grows)
- Spaces page for managing custom channel collections organized by user preferences
- Settings page for user preferences and blocked channel management
- Persistent layout with top navigation bar and collapsible sidebar

**Recent Changes (October 2025):**
- Home page restructured for better content focus: removed "Blocked Channels" section from home page (moved to Settings/Library)
- Video layout optimized to show content first, with "Your Spaces" section positioned after initial videos
- Page designed to scale with content growth through natural scrolling
- **Video Upload System Enhanced (Oct 6, 2025):**
  - Added POST /api/videos backend endpoint with authentication and channel validation
  - Completely revamped upload dialog with modern UI/UX
  - Video preview functionality with duration extraction
  - Category selection (17 categories: Gaming, Music, Education, Entertainment, etc.)
  - Tags system (up to 10 tags per video)
  - Real-time file validation (50MB limit, MP4/WebM/OGG/MOV formats)
  - Upload progress tracking with visual progress bar
  - Enhanced thumbnail management with preview
  - Comprehensive error handling with specific user guidance
  - Toast notifications for success/error feedback
  - Character count indicators for title and description
  - Visibility controls (Private, Unlisted, Public)
  - Schedule publishing feature
  - Audience type selection (made for kids/not made for kids)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- ESM (ECMAScript Modules) throughout the entire codebase for modern JavaScript compatibility
- Custom middleware for request logging and JSON parsing with raw body capture

**Rationale:** Express provides mature ecosystem with extensive middleware options. ESM adoption ensures compatibility with modern tooling and eliminates CommonJS/ESM interop issues.

**API Design:**
- RESTful API endpoints following conventional HTTP methods (GET, POST, PATCH, DELETE)
- Route handlers in `server/routes.ts` with Zod schema validation on request bodies
- Clear separation of concerns: routes handle HTTP → storage layer handles data logic → database performs persistence

**Authentication:**
- Replit OpenID Connect (OIDC) integration for user authentication
- Passport.js strategy for OIDC flow management
- Express sessions stored in PostgreSQL using connect-pg-simple
- Session cookies with 1-week TTL for persistent login

**Rationale:** OIDC provides standardized authentication. PostgreSQL-backed sessions prevent session loss on server restarts and enable horizontal scaling.

**Storage Layer Architecture:**
- Abstract `IStorage` interface defining all data operations
- `DbStorage` implementation using Drizzle ORM with PostgreSQL
- `MemStorage` implementation (in-memory) available for testing
- Storage methods return domain objects, not raw database rows

**Rationale:** Interface-based design enables swapping storage implementations for testing or migration. Keeping domain logic separate from database schema allows independent evolution.

### Database Architecture

**Database Provider:**
- Neon serverless PostgreSQL as the primary database
- Neon HTTP driver for serverless-friendly database connections
- Connection pooling handled automatically by Neon infrastructure

**Rationale:** Neon's serverless architecture eliminates connection pool management complexity and provides instant scaling. HTTP driver works in serverless environments where traditional TCP connections fail.

**Schema Design:**
- `users` table: User profiles with personal mode preferences and blocked channel lists
- `channels` table: Channel information including name, username, avatar, verification status, subscriber count
- `videos` table: Video metadata with foreign key to channels, category classification
- `spaces` table: User-created channel collections with color coding
- `subscriptions` table: Many-to-many relationship between users and channels
- `blocked_channels` table: Many-to-many relationship tracking blocked channels per user
- `sessions` table: Express session storage with automatic expiration

**ORM & Migrations:**
- Drizzle ORM for type-safe database queries with TypeScript inference
- Drizzle Kit for schema migrations with `drizzle.config.ts` configuration
- Schema defined in `shared/schema.ts` and shared between frontend/backend via TypeScript types
- Zod schemas generated from Drizzle schema using `drizzle-zod` for runtime validation

**Rationale:** Drizzle provides lightweight ORM with excellent TypeScript support without the overhead of TypeORM/Prisma. Sharing schema between client/server ensures type consistency.

**Known Issue - Neon HTTP Driver:**
The Neon HTTP driver has a bug where querying empty tables throws `TypeError: Cannot read properties of null` instead of returning empty arrays. A workaround using `isNeonNullError` helper has been implemented in `DbStorage` to catch this specific error pattern and return empty arrays for graceful degradation while preserving proper error handling for genuine database failures.

### External Dependencies

**Database:**
- Neon serverless PostgreSQL (via `@neondatabase/serverless` package)
- Connection string provided via `DATABASE_URL` environment variable
- HTTP-based connection protocol for serverless compatibility

**Authentication:**
- Replit OIDC provider at `https://replit.com/oidc`
- OpenID Connect client library (`openid-client` package)
- Passport.js for authentication middleware

**UI Component Library:**
- Radix UI primitives for accessible, unstyled components
- 20+ Radix UI packages for different component types (dialogs, dropdowns, tooltips, etc.)
- Tailwind CSS for utility-based styling
- Lucide React for icon components

**Development Tools:**
- Vite with Replit-specific plugins (@replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer)
- TypeScript compiler with strict mode enabled
- ESBuild for server-side code bundling in production

**Session Management:**
- connect-pg-simple for PostgreSQL session storage
- Express session middleware with secure cookie configuration
- 7-day session TTL with automatic cleanup

## Project Structure

The project follows a clean, flattened structure optimized for deployment:

```
/
├── client/              # React frontend application
│   ├── src/            # Source files (components, pages, hooks, etc.)
│   └── index.html      # Entry HTML file
├── server/             # Express backend application
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API route handlers
│   ├── storage.ts      # Database storage layer
│   ├── vite.ts         # Vite dev server setup
│   └── seed.ts         # Database seeding script
├── shared/             # Shared code between frontend/backend
│   └── schema.ts       # Drizzle database schema
├── dist/               # Production build output (generated)
│   ├── index.js        # Bundled server code
│   └── public/         # Built client assets
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── drizzle.config.ts   # Drizzle ORM configuration
```

**Recent Changes (October 2025):**
- Project restructured from nested CineWeave/TubeStream/ folders to root directory
- Optimized for deployment to external platforms (Render, Vercel, Railway, etc.)
- Clean build pipeline: client → dist/public, server → dist/index.js

## Deployment Instructions

### Deploying to Render (or similar platforms)

**1. Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

**2. Configure on Render:**

- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Environment Variables:**
  - `DATABASE_URL` - PostgreSQL connection string (provision a Postgres database on Render)
  - `NODE_ENV=production`
  - `SESSION_SECRET` - Random string for session encryption
  - `PORT` - Automatically set by Render (defaults to 5000 if not set)

**3. Database Setup:**
After deployment, run migrations:
```bash
npm run db:push
npm run db:seed  # Optional: seed with sample data
```

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# DATABASE_URL will be provided by Replit database

# Push database schema
npm run db:push

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Production Build

```bash
# Build both client and server
npm run build

# Start production server
npm run start
```

The production build creates:
- `dist/public/` - Static client assets served by Express
- `dist/index.js` - Bundled server application