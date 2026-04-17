<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# DevPulse — Agent Instructions

## Project Overview

DevPulse is a **private, single-user authenticated developer dashboard** built on Next.js 16 (App Router). It aggregates:
- **GitHub activity** via Personal Access Token (PAT)
- **Personal task management** with Prisma + SQLite/libsql
- **Daily focus feed** from OpenWeatherMap + NewsAPI

## Tech Stack

| Layer          | Technology                                |
|----------------|------------------------------------------|
| Framework      | Next.js 16.2.4 (App Router, Server Components) |
| Language       | TypeScript 5 (strict mode)               |
| React          | React 19                                 |
| Styling        | Tailwind CSS 4 (pure — no component library) |
| Auth           | NextAuth v5 (Auth.js) — Credentials provider |
| Database       | Prisma ORM + libsql (`@prisma/adapter-libsql`) — local SQLite file, Turso-compatible remote in prod |
| Deployment     | Vercel                                   |

## Critical Next.js 16 Rules

**ALWAYS follow these — they differ from Next.js 14/15 training data.**

1. **Async Request APIs (BREAKING):** `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are ALL async. You MUST `await` them:
   ```tsx
   // CORRECT
   const cookieStore = await cookies()
   const { id } = await params

   // WRONG — will throw at runtime
   const cookieStore = cookies()
   ```

2. **`proxy.ts` replaces `middleware.ts`:** The file convention is renamed. Create `proxy.ts` at the project root (same level as `app/`), NOT `middleware.ts`:
   ```tsx
   // proxy.ts
   import { NextRequest, NextResponse } from 'next/server'
   export function proxy(request: NextRequest) { ... }
   export const config = { matcher: [...] }
   ```

3. **Turbopack is the default bundler.** Do NOT add webpack-specific config to `next.config.ts` — it will cause build failures.

4. **Route Handlers use Web APIs:** Return `Response.json()`, not `NextResponse.json()` when possible.

5. **Before writing any Next.js code**, check the relevant docs in `node_modules/next/dist/docs/01-app/` for the current API.

## Project Architecture

```
dev-pulse/
├── proxy.ts                        # Route protection (replaces middleware.ts)
├── auth.ts                         # NextAuth v5 config
├── lib/
│   └── db.ts                       # Prisma singleton client
├── prisma/
│   └── schema.prisma               # User, Task, Project, UserSettings models
├── app/
│   ├── layout.tsx                  # Root layout (fonts, metadata)
│   ├── globals.css                 # Tailwind + CSS variables
│   ├── (auth)/
│   │   └── login/page.tsx          # Login form (email/password)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + session check
│   │   ├── page.tsx                # Dashboard home (widget grid)
│   │   ├── tasks/page.tsx          # Full task manager
│   │   └── settings/page.tsx       # PAT, API keys, preferences
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── tasks/route.ts          # GET all, POST create
│       ├── tasks/[id]/route.ts     # PATCH update, DELETE
│       ├── projects/route.ts       # GET all, POST create
│       ├── projects/[id]/route.ts  # DELETE
│       ├── github/route.ts         # GitHub REST API proxy
│       ├── weather/route.ts        # OpenWeatherMap proxy
│       └── news/route.ts           # NewsAPI proxy
└── components/
    ├── TasksWidget.tsx             # Dashboard compact task list
    ├── TaskModal.tsx               # Create/edit task form
    ├── GitHubWidget.tsx            # GitHub profile + repos
    ├── WeatherWidget.tsx           # Current weather + forecast
    └── NewsWidget.tsx              # Article feed
```

## Data Models

The Prisma schema defines four models and two enums:

- **User** — `id`, `email` (unique), `password` (bcrypt hash), `name?`, relations to Tasks, Projects, UserSettings
- **Task** — `id`, `title`, `description?`, `status` (TODO | IN_PROGRESS | DONE), `priority` (LOW | MEDIUM | HIGH), `dueDate?`, belongs to User, optionally belongs to Project
- **Project** — `id`, `name`, `color` (hex, default `#6366f1`), has many Tasks, belongs to User
- **UserSettings** — `id`, one-to-one with User, stores `githubPAT?`, `githubUsername?`, `weatherCity?`, `openWeatherKey?`, `newsApiKey?`, `newsKeywords?`

## Conventions

### Authentication
- Auth is handled by NextAuth v5 with the **Credentials provider** (email + bcrypt password).
- `auth.ts` at the project root exports the `auth`, `signIn`, `signOut` helpers.
- `proxy.ts` protects all routes under `/(dashboard)` — unauthenticated users are redirected to `/login`.
- Public routes: `/login`, `/api/auth/*`.
- Use `const session = await auth()` in Server Components to get the current session.

### API Routes
- All API routes live under `app/api/` and are **server-only** route handlers.
- External API calls (GitHub, Weather, News) are proxied through our own API routes — NEVER call external APIs directly from the client (this protects API keys).
- Always validate the session in API route handlers before processing requests.
- Return structured JSON: `{ data: T }` on success, `{ error: string }` on failure.
- Use proper HTTP status codes: 200 (ok), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error).

### Database Access
- Import the Prisma client from `lib/db.ts` — never instantiate `new PrismaClient()` directly.
- Always scope queries by `userId` from the authenticated session to prevent data leakage.
- Use `@default(cuid())` for all primary keys.

### Styling
- **Pure Tailwind CSS 4** — no component library (no shadcn, no MUI, no Chakra).
- Use the existing CSS variables (`--background`, `--foreground`) for theming.
- Dark mode via `prefers-color-scheme` media query (already configured in `globals.css`).
- Responsive: mobile-first, single column → grid on `sm:` / `md:` breakpoints.
- Loading states: use `animate-pulse` skeleton placeholders.
- Error states: inline within each widget, not global toasts.

### Components
- Widget components live in `components/` and are **client components** (`"use client"`).
- Widgets fetch data from our API routes using `fetch('/api/...')` — never import server-only code.
- Each widget handles its own loading, error, and empty states independently.
- Keep components focused — one widget per file, no mega-components.

### Security
- **NEVER expose API keys or PATs to the client.** All secrets stay server-side (env vars or DB, accessed only in API routes / Server Components).
- GitHub PATs stored in UserSettings should be encrypted with `AES-256-GCM` using an `ENCRYPTION_KEY` env var before persisting to the database.
- Validate and sanitize all user input in API routes at system boundaries.
- Use `Response.json()` — never leak stack traces or internal errors to the client.

### TypeScript
- Strict mode is enabled — do not use `any` or `@ts-ignore`.
- Define explicit types/interfaces for API response shapes.
- Use the `@/*` path alias for imports (maps to project root).

## Environment Variables

```env
# Database
DATABASE_URL="libsql://your-db.turso.io"   # Turso/libsql remote URL (prod)
# DATABASE_URL="file:./dev.db"              # SQLite local file (local dev)

# Auth
AUTH_SECRET="..."                     # NextAuth secret (generate with `openssl rand -base64 32`)

# Security
ENCRYPTION_KEY="..."                 # AES-256 key for encrypting stored PATs/API keys

# Optional — users configure these per-account in Settings, stored in DB
# GITHUB_PAT, OPENWEATHER_API_KEY, NEWS_API_KEY are NOT env vars —
# they are stored per-user in the UserSettings table.
```

## Verification Checklist

Before considering any feature complete:

1. `npm run build` passes with zero TypeScript errors
2. `npm run lint` passes with no warnings
3. Auth flow: login → dashboard, bad creds → error, no session → redirect to `/login`
4. All DB queries are scoped by `userId`
5. No API keys or secrets leak to client bundles
6. Responsive: works on mobile (single column) and desktop (grid)
7. Each widget has loading skeleton + error fallback
8. Dark mode renders correctly
