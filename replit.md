# CineWeave - Video Streaming Platform

## Overview

CineWeave is a video streaming platform similar to YouTube, focusing on enhanced personalization. It allows users to discover, watch, and organize video content through features like Personal Mode (a subscription-only feed), Spaces (customizable channel collections), and permanent channel blocking. The project aims to provide a robust, scalable, and user-friendly platform for video consumption and management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:** React 18 with TypeScript, Vite for fast development and optimized builds, and Wouter for lightweight client-side routing.
**UI Component System:** Shadcn UI (New York style) built on Radix UI primitives, styled with Tailwind CSS, supporting runtime theming and dark mode.
**State Management:** Zustand for global state, TanStack Query for server state management and caching, and React hooks for local component state.
**Key Application Features:**
- **Home Page:** Content-focused layout with top videos, "Your Spaces" section, and additional videos designed for natural scrolling.
- **Spaces Page:** Manages custom channel collections.
- **Settings Page:** User preferences and blocked channel management.
- **Persistent Layout:** Top navigation and collapsible sidebar.
- **Video Upload System:** Comprehensive video upload functionality including file validation, category/tag selection, iDrive E2 integration for object storage, progress tracking, thumbnail management, visibility controls, scheduling, and audience selection.
- **Watch Page:** Mobile-first responsive design matching YouTube's mobile UX, with optimized content hierarchy and touch targets.
- **Shorts Page:** Professional desktop and mobile UI with responsive grid layout, enhanced video cards for vertical aspect ratio content, and a full-featured `ShortsPlayer` supporting gestures, keyboard navigation, and interactive elements (like/dislike, subscribe, comments, share).

### Backend Architecture

**Server Framework:** Express.js with TypeScript and Node.js, utilizing ESM for modern JavaScript compatibility.
**API Design:** RESTful API endpoints with Zod schema validation, separating concerns between route handling, storage logic, and database persistence.
**Authentication:** Replit OpenID Connect (OIDC) integration via Passport.js, with Express sessions stored in PostgreSQL using `connect-pg-simple` and 1-week persistent session cookies.
**Storage Layer Architecture:** Abstract `IStorage` interface with `DbStorage` (Drizzle ORM with PostgreSQL) and `MemStorage` (in-memory) implementations, ensuring separation of domain logic from database specifics.

### Database Architecture

**Database Provider:** Neon serverless PostgreSQL, utilizing its HTTP driver for serverless-friendly connections and automatic connection pooling.
**Schema Design:**
- `users`: User profiles, personal mode preferences, blocked channels.
- `channels`: Channel information (name, avatar, verification, subscriber count).
- `videos`: Video metadata, foreign key to channels, category.
- `spaces`: User-created channel collections.
- `subscriptions`: Many-to-many user-channel relationships.
- `blocked_channels`: Many-to-many user-blocked channel relationships.
- `sessions`: Express session storage.
**ORM & Migrations:** Drizzle ORM for type-safe queries, Drizzle Kit for schema migrations, and shared schema (`shared/schema.ts`) with `drizzle-zod` for runtime validation. Includes a workaround for a Neon HTTP driver bug regarding empty table queries.

## External Dependencies

**Database:**
- Neon serverless PostgreSQL (`@neondatabase/serverless`) for primary data persistence.

**Authentication:**
- Replit OIDC provider (`https://replit.com/oidc`).
- `openid-client` library for OpenID Connect flow.
- Passport.js for authentication middleware.

**UI Component Library:**
- Radix UI primitives for accessible, unstyled components.
- Tailwind CSS for utility-first styling.
- Lucide React for icon components.

**Session Management:**
- `connect-pg-simple` for PostgreSQL-backed Express session storage.

**Object Storage:**
- iDrive E2 for video file storage.