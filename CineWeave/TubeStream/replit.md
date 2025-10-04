# CineWeave - Video Platform

## Overview

CineWeave is a YouTube-like video streaming platform with enhanced personalization features. The platform allows users to upload, watch, and discover videos while providing unique features like Personal Mode (subscription-only feed), permanent channel blocking, and Spaces (custom channel organization). The application uses a modern full-stack architecture with React frontend and Express backend, emphasizing user control over content discovery and recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

**UI Component System:**
- Shadcn UI components (New York style) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom CSS variables for theming
- Dark mode by default with comprehensive color system
- Component library includes 40+ pre-built components (buttons, dialogs, forms, etc.)

**State Management:**
- Zustand for global app state (personal mode toggle, search queries, current user)
- TanStack Query (React Query) for server state management and data fetching
- Local component state with React hooks

**Key Pages & Features:**
- Home page with video grid, category filters, and search functionality
- Spaces page for managing custom channel collections
- Settings page for user preferences and blocked channel management
- Layout system with persistent top navigation and sidebar

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- ESM module system throughout the codebase
- Custom middleware for request logging and JSON parsing

**API Design:**
- RESTful API endpoints for CRUD operations
- Route handlers in `server/routes.ts` with schema validation
- Separation of concerns: routes → storage layer → data

**Storage Layer:**
- In-memory storage implementation (`MemStorage` class) for development
- Interface-based design (`IStorage`) allows easy swapping to database implementation
- Methods for managing users, channels, videos, spaces, subscriptions, and blocked channels

**Development Setup:**
- Vite integration for serving frontend during development
- Hot module replacement (HMR) enabled
- Runtime error overlays and development banners via Replit plugins

### Data Models & Schema

**Database Design (Drizzle ORM):**
- PostgreSQL dialect configured via `drizzle.config.ts`
- Schema definitions in `shared/schema.ts` using Drizzle ORM
- Zod integration for runtime validation via `drizzle-zod`

**Core Entities:**

1. **Users**: Stores user accounts with username, email, personal mode preference, and array of blocked channel IDs
2. **Channels**: Content creator profiles with name, username, avatar, verification status, subscriber count
3. **Videos**: Video content with metadata (title, thumbnail, duration, views, category, upload timestamp, live status)
4. **Spaces**: User-created collections for organizing subscribed channels with customizable icons and colors
5. **Subscriptions**: Many-to-many relationship between users and channels

**Relationships:**
- Videos belong to channels (channelId foreign key)
- Spaces belong to users and contain arrays of channel IDs
- Subscriptions link users to channels
- Blocked channels stored as array in user record

### Key Features Implementation

**Personal Mode:**
- Toggle in global state controls content filtering
- When enabled, only shows videos from subscribed channels
- Completely disables algorithmic recommendations
- UI updates across all pages to respect this setting

**Channel Blocking:**
- Users can permanently block channels
- Blocked channels never appear in recommendations or search
- Block list managed in Settings page with export functionality
- Stored as array of channel IDs in user record

**Spaces System:**
- Users create custom categories (Gaming, Tech, etc.)
- Each space contains selected subscribed channels
- Videos can be filtered by space
- Custom icons and color themes for each space

## External Dependencies

### Database & ORM
- **Drizzle ORM** (`drizzle-orm`): Type-safe ORM for PostgreSQL database operations
- **Drizzle Kit** (`drizzle-kit`): Migration tool for schema management
- **Neon Serverless** (`@neondatabase/serverless`): Serverless PostgreSQL driver for Neon database
- Migration files output to `./migrations` directory

### UI Component Libraries
- **Radix UI**: 25+ primitive component libraries for accessible UI components (dialogs, dropdowns, tooltips, etc.)
- **Shadcn UI**: Pre-built component system based on Radix UI primitives
- **Lucide React**: Icon library with 1000+ customizable icons
- **Embla Carousel**: Carousel/slider functionality

### Styling & Theming
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Utility for creating variant-based component styles
- **clsx** & **tailwind-merge**: Class name manipulation utilities
- **PostCSS** with **Autoprefixer**: CSS processing

### Form Management
- **React Hook Form**: Form state management and validation
- **@hookform/resolvers**: Integration with Zod for schema validation
- **Zod**: TypeScript-first schema validation

### Data Fetching & State
- **TanStack Query**: Server state management, caching, and synchronization
- **Zustand**: Lightweight state management for client state

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across frontend and backend
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast JavaScript bundler for production builds

### Session Management
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store

### Utilities
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **cmdk**: Command palette component

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation tool
- **@replit/vite-plugin-dev-banner**: Development mode indicator