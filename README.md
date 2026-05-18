# CineWeave

A full-stack video streaming platform built with React, TypeScript, and Node.js — inspired by YouTube, focused on personalization.

> Built as a personal project to explore full-stack engineering at scale: cloud media storage, relational database design, session-based authentication, and a polished responsive UI across desktop and mobile.

---

## What It Does

CineWeave lets users discover, watch, and organize video content in a highly personalized way. Viewers get real control over what they see through features like Personal Mode, Spaces, and permanent channel blocking — going beyond what a standard algorithmic feed offers.

**Core user flows:**
- Browse and watch long-form videos and Shorts (separate feeds, separate API endpoints)
- Subscribe to channels, like/dislike videos, comment, add videos to playlists
- Create custom **Spaces** — named groups of channels that filter your home feed
- Enable **Personal Mode** — replaces the home feed with only subscribed channel content
- Permanently **block channels** from all feeds and recommendations
- **Upload videos** directly to Cloudinary from the browser (signed direct upload — server never buffers the binary)
- Manage **watch history** (pause recording, clear all) and **playlists** (CRUD + ordered video list)
- Switch between **Light / Dark / Device** themes, persisted across sessions

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| `react` + `react-dom` | 18.3 | UI framework |
| `typescript` | 5.6 | Type safety |
| `vite` | 5.4 | Build tool and dev server |
| `wouter` | 3.3 | Lightweight client-side routing |
| `tailwindcss` | 3.4 | Utility-first styling |
| `shadcn/ui` + `@radix-ui/*` | — | Accessible component primitives |
| `zustand` | 5.0 | Global state (theme, personalMode, pauseHistory — persisted to localStorage) |
| `@tanstack/react-query` | 5.60 | Server state, caching, background refetch |
| `react-hook-form` + `@hookform/resolvers` | 7.55 / 3.10 | Form management with Zod validation |
| `lucide-react` | 0.453 | Icon library |
| `date-fns` | 3.6 | Date formatting (e.g. `formatDistanceToNow` in Watch page) |
| `recharts` | 2.15 | Charts in Studio Analytics dashboard |
| `framer-motion` | 11.13 | Animations |
| `embla-carousel-react` | 8.6 | Carousel (via Shadcn carousel component) |
| `input-otp` | 1.4 | OTP digit input field |
| `react-icons` | 5.4 | Brand / company logos |
| `zod` | 3.24 | Schema validation (shared with backend) |

### Backend

| Package | Version | Purpose |
|---|---|---|
| `express` | 4.21 | HTTP server |
| `tsx` | 4.20 | TypeScript runner (ESM) |
| `drizzle-orm` | 0.39 | Type-safe SQL query builder |
| `drizzle-kit` | 0.31 | Schema migrations (`npm run db:push`) |
| `drizzle-zod` | 0.7 | Auto-generates Zod schemas from Drizzle tables |
| `postgres` | 3.4 | PostgreSQL driver (postgres.js) |
| `cloudinary` | 2.9 | Video and image upload, CDN delivery, signed upload |
| `multer` | 2.0 | Multipart file parsing for server-side uploads |
| `passport` + `openid-client` | 0.7 / 6.8 | Auth middleware; OIDC strategy active in Replit environment |
| `connect-pg-simple` | 10.0 | Stores Express sessions in Supabase PostgreSQL |
| `express-session` | 1.18 | Session middleware |
| `nanoid` | 5.1 | Unique ID generation |
| `zod` + `zod-validation-error` | 3.24 / 3.4 | API input validation |

### Infrastructure

| Service | Purpose |
|---|---|
| **Supabase** | Managed PostgreSQL database (connected via `postgres.js` with `prepare: false` for Supabase's transaction pooler — see `server/db.ts` line 9) |
| **Cloudinary** | Video and image storage + CDN. Signed direct upload bypasses the server entirely |
| **Replit** | Hosting and deployment |

---

## Project Structure

```
cineweave/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                   # Router, theme effect (useEffect on `theme` state → adds .dark/.light class to <html>)
│       ├── main.tsx                  # React root mount
│       ├── index.css                 # CSS variable blocks: :root (dark default), .dark, .light
│       ├── components/
│       │   ├── Layout.tsx            # Page shell: TopNavigation + Sidebar + main content
│       │   ├── Sidebar.tsx           # Collapsible nav sidebar with footer links (243 lines)
│       │   ├── TopNavigation.tsx     # Search bar, auth buttons, notification bell
│       │   ├── CustomVideoPlayer.tsx # HTML5 video player with YouTube-style controls
│       │   ├── ShortsPlayer.tsx      # Full-screen vertical Shorts player (swipe + keyboard nav)
│       │   ├── UploadVideoDialog.tsx # 5-step upload flow using Cloudinary signed upload
│       │   ├── VideoCard.tsx         # Standard 16:9 video card for feeds
│       │   ├── SpaceCard.tsx         # Channel group card
│       │   ├── AccountMenu.tsx       # User avatar dropdown
│       │   └── ui/                   # Shadcn components (button, card, dialog, input, etc.)
│       ├── pages/
│       │   ├── Home.tsx              # Main feed (long-form only, Spaces section)
│       │   ├── Watch.tsx             # Video player page, comments, likes, related
│       │   ├── Shorts.tsx            # Shorts feed → opens ShortsPlayer
│       │   ├── Trending.tsx          # Trending videos
│       │   ├── Subscriptions.tsx     # Feed from subscribed channels
│       │   ├── Spaces.tsx            # Create / manage Spaces
│       │   ├── Library.tsx           # Playlists, History, Watch Later hub
│       │   ├── Playlist.tsx          # Playlist detail: ordered video list, play all, edit, delete
│       │   ├── History.tsx           # Watch history list
│       │   ├── WatchLater.tsx        # Saved videos queue
│       │   ├── Search.tsx            # Search results with sort/duration/date filters
│       │   ├── Channel.tsx           # Channel profile page
│       │   ├── Settings.tsx          # Preferences, blocked channels, history controls
│       │   ├── Appearance.tsx        # Theme switcher (Light / Dark / Device)
│       │   ├── Notifications.tsx     # Notification feed
│       │   ├── Explore.tsx           # Category browsing
│       │   ├── Help.tsx              # Help center
│       │   ├── Feedback.tsx          # User feedback form
│       │   ├── Landing.tsx           # Unauthenticated landing page
│       │   ├── About.tsx             # Company info, leadership, stats
│       │   ├── Press.tsx             # Press releases, media kit
│       │   ├── Copyright.tsx         # DMCA policy, takedown process
│       │   ├── Contact.tsx           # Support channels + contact form
│       │   ├── Creators.tsx          # Creator program, monetization eligibility
│       │   ├── Advertise.tsx         # Ad formats, campaign inquiry
│       │   ├── Developers.tsx        # API overview, endpoints, rate limits
│       │   ├── Terms.tsx             # Terms of Service
│       │   ├── Privacy.tsx           # Privacy Policy
│       │   ├── PolicySafety.tsx      # Community Guidelines
│       │   ├── HowItWorks.tsx        # Platform explanation, recommendation weights
│       │   ├── TestFeatures.tsx      # Beta experiments with live toggles
│       │   └── studio/
│       │       ├── Dashboard.tsx     # Creator overview
│       │       ├── Content.tsx       # Manage uploaded videos
│       │       ├── Analytics.tsx     # Charts via recharts
│       │       └── Settings.tsx      # Channel settings
│       ├── hooks/
│       │   ├── useAuth.ts            # Wraps /api/auth/user query, exposes user + isAuthenticated
│       │   └── use-toast.ts          # Toast notification hook
│       ├── store/
│       │   └── useAppStore.ts        # Zustand store (66 lines): theme, personalMode, pauseHistory, currentUserId, sidebarCollapsed
│       └── lib/
│           └── queryClient.ts        # TanStack Query client + apiRequest helper (57 lines)
│
├── server/
│   ├── index.ts                      # Express app setup, session config, static serving (81 lines)
│   ├── routes.ts                     # All API route handlers (1557 lines)
│   │   ├── Auth            lines 68–175     (GET /api/auth/user, POST send-otp, verify-otp, logout)
│   │   ├── Users           lines 178–221    (GET/POST/PATCH users)
│   │   ├── Channels        lines 223–331    (GET/POST/PATCH channels)
│   │   ├── Videos          lines 333–838    (list, shorts, search, by-channels, CRUD)
│   │   ├── Upload          lines 492–725    (signed URL, server-side video/thumbnail/avatar)
│   │   ├── Spaces          lines 869–912    (CRUD)
│   │   ├── Subscriptions   lines 914–1004   (follow/unfollow, status check)
│   │   ├── Blocking        lines 1006–1057  (block/unblock channel, list blocked)
│   │   ├── Comments        lines 1058–1161  (CRUD + comment likes)
│   │   ├── Likes           lines 1163–1230  (like/dislike video, stats, status)
│   │   ├── Watch History   lines 1232–1291  (add with upsert, list, delete one, clear all)
│   │   ├── Watch Later     lines 1294–1350  (add, list, check, remove, clear)
│   │   ├── Playlists       lines 1367–1500  (CRUD, add/remove videos, detail + videos with JOIN)
│   │   └── Notifications   lines 1515–1557  (list, unread count, mark read)
│   ├── storage.ts                    # Data access layer (1408 lines)
│   │   ├── IStorage interface        lines 4–100     (all method signatures)
│   │   ├── MemStorage class          lines 101–625   (in-memory fallback, no implements IStorage)
│   │   └── DbStorage class           lines 626–1407  (implements IStorage, all Drizzle queries)
│   │       export const storage      line 1408
│   ├── videoStorage.ts               # Cloudinary wrapper (192 lines)
│   │   ├── cloudinary.config()       lines 4–9       (env vars: CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)
│   │   ├── uploadBufferToCloudinary  lines 35–67     (stream-based server-side upload)
│   │   ├── uploadVideoToStorage      lines 72–89     (server-side video upload)
│   │   ├── uploadThumbnailToStorage  lines 94–107    (server-side image upload)
│   │   ├── deleteVideoFromStorage    lines 112–117   (destroy asset by public_id)
│   │   ├── isStorageConfigured       lines 122–128   (env var check)
│   │   └── generatePresignedUploadUrl lines 138–192  (signed payload for direct browser upload)
│   ├── db.ts                         # Supabase connection via postgres.js + Drizzle (12 lines)
│   └── replitAuth.ts                 # Passport.js setup; OIDC strategy active in Replit env (262 lines)
│
├── shared/
│   └── schema.ts                     # Single source of truth for types (287 lines)
│       ├── Table definitions         lines 6–159     (14 tables)
│       ├── Insert schemas (drizzle-zod) lines 161–224
│       └── TypeScript types          lines 225–287
│
├── drizzle.config.ts                 # Points drizzle-kit at DATABASE_URL
└── package.json                      # Scripts: dev, build, start, db:push, db:seed
```

---

## Database Schema

Defined in `shared/schema.ts` using Drizzle ORM. All 14 tables:

| Table | Lines | Description |
|---|---|---|
| `sessions` | 6–15 | Express session storage (connect-pg-simple) |
| `users` | 16–34 | Profiles, personalMode flag, pauseHistory |
| `channels` | 35–46 | Name, avatar URL, verification, subscriber count |
| `videos` | 47–63 | Metadata, Cloudinary URL, `isShorts` boolean, category |
| `spaces` | 64–73 | User-created channel group with name + description |
| `subscriptions` | 74–79 | Many-to-many: users ↔ channels |
| `comments` | 80–90 | Video comments with optional parentId for replies |
| `likes` | 91–100 | Like/dislike per user per video (`value`: 1 or -1) |
| `watch_history` | 101–108 | Upserted on re-watch (no duplicate rows per user+video) |
| `watch_later` | 109–117 | Saved video queue per user |
| `feedback` | 118–125 | User-submitted feedback messages |
| `playlists` | 126–135 | Name, description, isPublic flag, per user |
| `playlist_videos` | 136–145 | Ordered many-to-many: playlists ↔ videos (position integer) |
| `notifications` | 146–159 | Per-user notification feed with read/unread state |

Each table has a matching Zod insert schema (lines 161–224) and TypeScript `type` exports (lines 225–287). The same `shared/schema.ts` is imported by both frontend (for types) and backend (for queries) — no type drift.

---

## Key Technical Decisions

### Direct Browser Upload to Cloudinary (`server/videoStorage.ts` lines 138–192)
The backend generates a **signed upload payload** (timestamp + HMAC-SHA1 signature using `cloudinary.utils.api_sign_request`). The browser POSTs the file as `multipart/form-data` directly to `https://api.cloudinary.com/v1_1/<cloud>/video/upload`. The server never receives the binary — it only saves the returned Cloudinary URL to the database. This lets GB-sized videos upload without touching server RAM.

The 5-step upload flow lives in `client/src/components/UploadVideoDialog.tsx`:
1. Request signed payload → `POST /api/upload/presigned-url` (`routes.ts` line 492)
2. Upload video directly to Cloudinary
3. Request signed payload for thumbnail
4. Upload thumbnail directly to Cloudinary
5. Save metadata → `POST /api/videos` (`routes.ts` line 726)

### Storage Abstraction (`server/storage.ts` lines 4–100)
`IStorage` is an interface defining all data access methods. `DbStorage` (`routes.ts` lines 626–1407) implements it with Drizzle ORM queries against Supabase. `MemStorage` (`routes.ts` lines 101–625) is an in-memory fallback used in development when no database is available. All route handlers call `storage.*` methods — they never query the database directly.

### Watch History Upsert (`server/storage.ts`, `DbStorage.addToWatchHistory`)
Instead of inserting a new row every time a video is watched, the method checks for an existing `(userId, videoId)` pair first. If found, it updates `watchedAt` and `watchDuration`. If not, it inserts. This keeps the history list clean without a unique DB constraint.

### Shared Schema (`shared/schema.ts`)
One file exports Drizzle table definitions, `drizzle-zod` insert schemas, and TypeScript types. The backend imports table objects for Drizzle queries. The frontend imports TypeScript types for `useQuery` generics. Zod schemas are used for `req.body` validation in routes. No duplication, no drift.

### Theme Switching (`client/src/App.tsx`)
A `useEffect` on the `theme` value from Zustand removes both `light` and `dark` from `document.documentElement.classList` then adds the correct one. Three CSS variable blocks in `client/src/index.css` (`:root` for dark default, `.dark`, `.light`) handle all color tokens. The Zustand store persists `theme` to `localStorage` via the `persist` middleware.

---

## Authentication

Email OTP flow (`server/routes.ts` lines 98–162):
1. User enters email → `POST /api/auth/email/send-otp` (line 98) — generates and sends a 6-digit code
2. User enters code → `POST /api/auth/email/verify-otp` (line 115) — validates code, upserts user row, writes `userId` to `req.session`
3. All protected routes call `isAuthenticated` middleware (`server/replitAuth.ts`) which checks `req.session.userId`
4. Sessions are stored in Supabase via `connect-pg-simple` (configured in `server/index.ts`)

---

## API Reference Summary

All routes defined in `server/routes.ts`. Base path: `/api`

```
Auth
  GET    /auth/user                         current session user
  POST   /auth/email/send-otp               send OTP to email
  POST   /auth/email/verify-otp             verify OTP, start session
  POST   /auth/email/logout                 destroy session

Videos
  GET    /videos                            list (long-form only, excludes shorts)
  GET    /videos/shorts                     list shorts only
  GET    /videos/search                     search with filters
  GET    /videos/by-channels                videos from a set of channel IDs
  GET    /videos/:id                        single video
  POST   /videos                            create (after upload)
  PATCH  /videos/:id                        update metadata
  DELETE /videos/:id                        delete + remove from Cloudinary
  POST   /videos/:id/view                   increment view count
  POST   /videos/:id/like                   like or dislike
  GET    /videos/:id/stats                  views + like/dislike counts
  GET    /videos/:id/comments               list comments
  POST   /videos/:id/comments               add comment

Upload
  POST   /upload/presigned-url              Cloudinary signed payload for direct upload
  POST   /upload/video                      server-side video upload (fallback)
  POST   /upload/thumbnail                  server-side thumbnail upload
  POST   /upload/avatar                     server-side avatar upload
  GET    /storage/status                    check if Cloudinary is configured

Playlists
  GET    /playlists/:userId                 user's playlists
  POST   /playlists                         create
  PATCH  /playlists/:id                     rename / toggle visibility
  DELETE /playlists/:id                     delete
  POST   /playlists/:id/videos              add video
  DELETE /playlists/:id/videos/:videoId     remove video
  GET    /playlists/detail/:id              single playlist metadata
  GET    /playlists/:id/videos              playlist videos with full video + channel JOIN

Watch History
  POST   /watch-history                     record (upserts — no duplicates)
  GET    /watch-history/:userId             list
  DELETE /watch-history/:userId/:videoId    remove one
  DELETE /watch-history/:userId             clear all

Spaces / Subscriptions / Blocking / Notifications
  CRUD on /spaces, /subscriptions, /users/:id/block, /notifications
```

---

## Running Locally

**Prerequisites:** Node.js 18+, a Supabase project (PostgreSQL), a Cloudinary account

```bash
# 1. Clone the repo
git clone https://github.com/your-username/cineweave.git
cd cineweave

# 2. Install dependencies
npm install

# 3. Create .env with your credentials
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true
SESSION_SECRET=your-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 4. Push schema to Supabase
npm run db:push

# 5. Start dev server (Express + Vite on port 5000)
npm run dev
```

Open `http://localhost:5000`. Vite and Express run on the same port — no proxy setup needed.

---

## Roadmap

- [ ] Live streaming
- [ ] AI-generated video summaries and auto-chapters (experimental UI already in `/test-features`)
- [ ] Ambient mode — video colors extend into page background
- [ ] Creator monetization dashboard
- [ ] Web Push notifications
- [ ] Full-text video search using PostgreSQL `tsvector`

---

*Built by Ashis Kumar Sahu · [ashissahu7436@gmail.com](mailto:ashissahu7436@gmail.com)*
