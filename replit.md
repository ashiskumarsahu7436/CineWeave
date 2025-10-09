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

## Recent Changes & Updates

- **Video Player Modernization (Oct 9, 2025):**
  - **YouTube-Style Controls:**
    - 10-second skip controls moved to video center sides (left/right) instead of bottom
    - Round buttons with backdrop blur and hover scale animations
    - Controls auto-hide after 1 second on both mobile and desktop (YouTube behavior)
  - **Modern Play/Pause Animation:**
    - Center overlay with animated fade-in/zoom-in effect
    - Shows correct icon (play/pause) based on current state
    - Disappears after 1 second (instant feedback like YouTube)
    - Static play button when paused with hover scale effect
  - **Mobile Optimization:**
    - Touch-friendly 56px buttons for skip controls
    - Consistent auto-hide behavior across all devices
    - Responsive sizing for all screen sizes

- **Database Cleanup (Oct 9, 2025):**
  - Deleted all sample/seed videos from database (16 videos removed)
  - Fixed Shorts player default audio state: now **unmuted by default** instead of muted
  - Database ready for production deployment with user's own iDrive E2 storage

- **Shorts Page Complete Redesign (Oct 9, 2025):**
  - **Professional Desktop & Mobile UI:**
    - Gradient red/pink play icon in header matching YouTube Shorts branding
    - Clean sticky header with tabs (All, Subscriptions, Trending)
    - Responsive grid layout: 2-7 columns based on screen size (mobile to 2xl)
    - Professional card design with rounded corners and ring borders
    - Duration badges on each video (top-right corner)
    - Smooth hover effects with scale animation (1.05x) and shadow
    - Play button overlay with white background on hover
    - Gradient overlays (black/90 to transparent) for better text visibility
    - Channel avatars with ring borders
    - View counts and channel names clearly displayed
  - **Enhanced Video Cards:**
    - Vertical aspect ratio (9:16) optimized for shorts
    - High-quality thumbnails with object-cover
    - Title truncation (2 lines max) with proper text hierarchy
    - Channel info with verification badges
    - Touch-friendly tap targets for mobile
  - **Full-Featured ShortsPlayer:**
    - **Responsive Design:** Optimized for both mobile and desktop
    - **Auto-hiding Controls:** Controls fade after 3 seconds for immersive viewing
    - **Like/Dislike:** Visible counts with heart animation for likes
    - **Subscribe Button:** Integrated in player with subscribed state
    - **Comments:** Count display with navigation to full video
    - **Share:** Native share API with clipboard fallback
    - **Remix Button:** Placeholder for future remix feature
    - **Navigation:** 
      - Mobile: Swipe up/down gestures for video navigation
      - Desktop: Arrow buttons (up/down) on right side
      - Keyboard: Arrow keys, Space (play/pause), M (mute), Escape (close)
    - **Progress Indicator:** Visual dots showing position (max 10 shown + counter)
    - **Mute Toggle:** Top-right corner with icon feedback
    - **Channel Info:** Large avatar with verification badge and subscriber count
    - **Gradient Overlays:** Top and bottom gradients for better UI visibility
    - **Play/Pause Overlay:** Large centered icon when paused
    - **Close Button:** Easy exit with X button (top-right)

- **Watch Page Mobile Optimization (Oct 9, 2025):**
  - Complete mobile-first redesign matching YouTube's mobile UX
  - Moved description to dedicated "Description" tab (with info panel)
  - Reorganized content hierarchy: Video → Channel info → Actions → Tabs
  - Optimized touch targets (44px minimum) for better mobile interaction
  - Improved spacing and padding for mobile screens (<640px)
  - Clean separation of mobile and desktop layouts using Tailwind breakpoints
  - Enhanced visual hierarchy with better typography scaling