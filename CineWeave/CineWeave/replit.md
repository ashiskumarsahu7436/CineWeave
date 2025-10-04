# CineWeave - Video Streaming Platform

## Overview
CineWeave is a YouTube-like video streaming application with enhanced features including Personal Mode (subscription-only feed), Spaces (custom channel organization), and permanent channel blocking. The platform uses React + Vite frontend with Express backend and PostgreSQL database via Neon serverless.

## Recent Changes (October 4, 2025)
- Implemented proper error handling for Neon HTTP driver null results in DbStorage layer
- Added `isNeonNullError` helper to specifically detect and handle Neon's "Cannot read properties of null" errors
- Updated `getAllChannels`, `getSpacesByUser`, `getSubscriptions`, and `getBlockedChannels` to catch Neon null errors while preserving proper error handling for other database failures
- Added structured logging when Neon null errors are handled for diagnosis
- Added .gitignore for Node.js/TypeScript project
- Cleaned up test files

## Project Architecture

### Frontend
- **Technology**: React + TypeScript with Vite
- **Port**: 5000
- **Components**: VideoCard, SpacesPanel, ChannelList, etc.
- **Configuration**: Vite configured to allow all hosts for Replit iframe compatibility

### Backend
- **Technology**: Express.js + TypeScript
- **Port**: 5000
- **Database**: PostgreSQL via Neon serverless (HTTP driver)
- **ORM**: Drizzle ORM
- **Storage**: DbStorage (PostgreSQL) for data persistence

### Database
- **Provider**: Neon serverless PostgreSQL
- **Schema**: channels, videos, users, spaces, subscriptions, blocked_channels
- **Seeded Data**: 3 channels (A Gamingcraft, A Filmcraft, Tech Vision) with 5 videos

## Known Limitations

### Neon HTTP Driver Issues
The Neon HTTP driver has a bug where it throws a TypeError ("Cannot read properties of null") internally when querying empty tables instead of returning empty arrays. This happens because the driver tries to call `.map()` on null results.

**Workaround Applied**: 
- Added `isNeonNullError` helper method in DbStorage to specifically identify this error pattern
- Wrapped affected database queries in try-catch blocks that:
  1. Catch only the specific Neon null TypeError (other errors are rethrown to preserve observability)
  2. Log when this error is handled for diagnosis
  3. Return empty arrays for graceful degradation
  4. Allow route handlers to properly return 500 errors for genuine database failures

**Fixed Methods in DbStorage**:
- `getAllChannels()` - Returns empty array when channels table is empty
- `getSpacesByUser()` - Returns empty array when spaces table is empty
- `getSubscriptions()` - Returns empty array when subscriptions table is empty
- `getBlockedChannels()` - Returns empty array when blocked channels query returns null

### Missing Features (Not Yet Implemented)
- User authentication (currently using hardcoded user ID)
- Personal Mode toggle functionality
- Channel blocking
- Subscriptions management
- Search functionality
- Video upload

## Development

### Installation
```bash
cd TubeStream
npm install
```

### Running the Application
```bash
npm run dev
```

### Database Operations
```bash
npm run db:push        # Sync schema to database
npm run db:push --force # Force sync (use if regular push fails)
```

## User Preferences
- Simple, everyday language for communication
- Avoid technical jargon in user-facing content

## Environment Variables
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NODE_TLS_REJECT_UNAUTHORIZED=0` - Required for Neon SSL in development

## Deployment Configuration
- Deployment target: autoscale (stateless website)
- Build: `npm run build`
- Run: Production server command (to be configured)
