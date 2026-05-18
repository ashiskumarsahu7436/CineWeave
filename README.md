# CineWeave

A full-stack video streaming platform built with React, TypeScript, and Node.js — inspired by YouTube, designed around personalization.

> Built as a personal project to explore full-stack development at scale: real authentication, cloud object storage, a relational database, and a polished UI across desktop and mobile.

---

## What It Does

CineWeave lets users discover, watch, and organize video content in a highly personalized way. Unlike standard video feeds, it gives viewers real control over what they see through features like Personal Mode, Spaces, and permanent channel blocking.

**Core user flows:**
- Browse and watch long-form videos and Shorts
- Subscribe to channels, like/dislike videos, add to playlists
- Create custom Spaces (grouped channel collections) for organized browsing
- Enable Personal Mode to see only subscribed content — no algorithm
- Block channels permanently from all feeds and recommendations
- Upload videos directly to cloud storage from the browser
- Manage watch history (pause, clear) and playlists

---

## Live Demo

> Hosted on Replit — [cineweave.replit.app](https://cineweave.replit.app)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Wouter | Lightweight client-side routing |
| Tailwind CSS | Utility-first styling |
| Shadcn UI + Radix UI | Accessible component primitives |
| Zustand | Global state management (persisted to localStorage) |
| TanStack Query v5 | Server state, caching, and background refetching |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | HTTP server |
| TypeScript (ESM) | Type-safe backend code |
| Drizzle ORM | Type-safe SQL queries and schema |
| Drizzle Kit | Database migrations |
| Zod + drizzle-zod | Runtime validation for all API inputs |
| Passport.js | Authentication middleware |
| connect-pg-simple | PostgreSQL-backed session storage |

### Database & Storage
| Technology | Purpose |
|---|---|
| Neon (serverless PostgreSQL) | Primary database via HTTP driver |
| iDrive E2 (S3-compatible) | Video and thumbnail object storage |
| AWS SDK v3 | Pre-signed URL generation for direct uploads |

---

## Key Features & Technical Highlights

### Direct-to-Cloud Video Upload
Rather than routing uploads through the server (which would exhaust RAM on a small instance), the upload system uses **pre-signed URLs**:
1. Client requests a pre-signed URL from the backend
2. Browser uploads the file **directly to iDrive E2** via a PUT request — the server never sees the binary data
3. Backend saves only the lightweight metadata to the database

This means GB-sized videos can be uploaded with zero server RAM impact, and multiple users can upload simultaneously.

### Personal Mode
A toggle that completely replaces the algorithmic feed with a clean list of content from subscribed channels only. State is persisted via Zustand + localStorage so it survives page refreshes.

### Spaces
Users can group channels into named collections (e.g. "Tech", "Gaming", "Cooking"). Switching Spaces filters the home feed to only those channels — a level of curation beyond standard subscriptions.

### Watch History with Pause
Full watch history tracking with a "Pause History" toggle in Settings. When paused, videos play normally but nothing is recorded. History can also be fully cleared. The backend upserts on re-watch rather than creating duplicate rows.

### Shorts Player
A full-screen vertical video experience matching YouTube Shorts UX:
- Mobile: swipe up/down to navigate between videos
- Desktop: arrow buttons + full keyboard support (arrow keys, Space, M, Escape)
- Auto-hiding controls, like/dislike with counts, subscribe button, share via Web Share API with clipboard fallback

### Playlist Management
Full CRUD for playlists: create, rename, set public/private, add/remove videos, and a dedicated playlist detail page with a "Play all" button.

### Light/Dark/Device Theme
Three-way theme switcher persisted to localStorage. Light mode uses a separate `.light` CSS variable block. "Device" follows the OS `prefers-color-scheme` media query.

### Type-Safe Full Stack
The schema in `shared/schema.ts` is the single source of truth — Drizzle table definitions, Zod insert schemas, and TypeScript types are all derived from the same file and used on both frontend and backend.

---

## Database Schema

```
users            — profiles, preferences, blocked channel list
channels         — name, avatar, verification status, subscriber count
videos           — metadata, category, isShorts flag, iDrive storage key
spaces           — user-created channel collections
space_channels   — many-to-many: spaces ↔ channels
subscriptions    — many-to-many: users ↔ channels
blocked_channels — many-to-many: users ↔ blocked channels
playlists        — user playlists with name, description, visibility
playlist_videos  — ordered many-to-many: playlists ↔ videos
watch_history    — upserted on re-watch (no duplicate rows)
watch_later      — saved videos queue
likes            — video likes/dislikes per user
comments         — video comments with nesting support
notifications    — per-user notification feed
sessions         — express-session storage (connect-pg-simple)
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Home feed (long-form videos, Spaces section) |
| `/shorts` | Full-screen Shorts player (swipe navigation) |
| `/trending` | Trending videos |
| `/subscriptions` | Feed from subscribed channels |
| `/spaces` | Manage Spaces |
| `/library` | Playlists, History, Watch Later |
| `/playlist/:id` | Playlist detail with video list |
| `/history` | Watch history |
| `/watch-later` | Saved videos |
| `/watch/:id` | Video player (mobile-first layout) |
| `/channel/:id` | Channel page |
| `/search` | Search results with filters |
| `/settings` | Account preferences, blocked channels, history |
| `/appearance` | Light / Dark / Device theme selector |
| `/studio/*` | Creator Studio (upload, analytics, content management) |
| `/about`, `/press`, `/creators`, `/advertise`, `/developers` | Company & platform pages |
| `/terms`, `/privacy`, `/policy-safety`, `/copyright` | Legal pages |
| `/how-it-works`, `/test-features`, `/contact` | Platform info pages |

---

## Authentication

Email OTP login — users enter their email address, receive a one-time code, and are verified without a password. Sessions are stored server-side in PostgreSQL with a 1-week expiry. Protected routes check session state on the backend via Passport.js middleware.

---

## Running Locally

**Prerequisites:** Node.js 18+, a Neon PostgreSQL database, an iDrive E2 bucket

```bash
# 1. Clone the repo
git clone https://github.com/your-username/cineweave.git
cd cineweave

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in: DATABASE_URL, SESSION_SECRET, IDRIVE_E2_ACCESS_KEY,
#          IDRIVE_E2_SECRET_KEY, IDRIVE_E2_BUCKET, IDRIVE_E2_ENDPOINT

# 4. Run database migrations
npm run db:push

# 5. Start the dev server (Express + Vite on port 5000)
npm run dev
```

The app is served at `http://localhost:5000`. Vite proxies frontend requests to Express — no separate ports to manage.

---

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, TopNavigation, video cards, dialogs
│   │   ├── pages/          # One file per route (~40 pages)
│   │   ├── hooks/          # useAuth, useToast, custom query hooks
│   │   ├── store/          # Zustand stores (app state, theme, history pause)
│   │   └── lib/            # queryClient, API request helper
├── server/
│   ├── index.ts            # Express entry point
│   ├── routes.ts           # All API route definitions (~1500 lines)
│   ├── storage.ts          # IStorage interface + DbStorage implementation
│   └── videoStorage.ts     # iDrive E2 operations, pre-signed URL generation
├── shared/
│   └── schema.ts           # Drizzle schema + Zod types (shared frontend/backend)
└── drizzle.config.ts
```

---

## Roadmap

- [ ] Live streaming support
- [ ] AI-generated video summaries and smart chapters
- [ ] Ambient mode (video color extends into page background)
- [ ] Creator monetization dashboard (ad revenue, memberships)
- [ ] Push notifications via Web Push API
- [ ] Mobile app (React Native)
- [ ] Full-text search with PostgreSQL `tsvector`

---

## Screenshots

> Add screenshots here once the app is deployed publicly.

---

## License

MIT — free to use, modify, and distribute.

---

*Built by Ashis Kumar Sahu — [ashissahu7436@gmail.com](mailto:ashissahu7436@gmail.com)*
