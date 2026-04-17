@AGENTS.md

# Claude-Specific Instructions for DevPulse

## Before You Code

1. **Read the AGENTS.md file first** — it contains the full architecture, conventions, and Next.js 16 gotchas.
2. **Check `node_modules/next/dist/docs/01-app/`** before using any Next.js API — do not rely on training data.
3. **Read the session plan** if available in `/memories/session/plan.md` for current phase context.

## Key Reminders

- This is **Next.js 16** — `proxy.ts` NOT `middleware.ts`, all request APIs are async (`await cookies()`, `await params`), Turbopack is default.
- Auth uses **NextAuth v5 (`next-auth@beta`)** with Credentials provider — NOT OAuth, NOT NextAuth v4.
- GitHub data comes from a **PAT stored in UserSettings DB** — NOT from an OAuth flow.
- Database is **Prisma + SQLite/libsql** (`@prisma/adapter-libsql`) — local dev uses a local SQLite file; production uses a libsql-compatible remote (e.g., Turso).
- UI is **pure Tailwind CSS 4** — do NOT install or suggest shadcn, Radix, MUI, or any component library.
- All external API calls (GitHub, Weather, News) go through **server-side API route proxies** — never from the client.

## Code Style

- Use `"use client"` only when necessary (event handlers, hooks, browser APIs).
- Server Components are the default — prefer them for data fetching.
- Import from `@/*` path alias, not relative `../../` paths.
- No `any`, no `@ts-ignore`, no `eslint-disable` without justification.
- Keep files focused — one component/route handler per file.
- Validate input at system boundaries (API routes), not deep in business logic.

## When Making Changes

- Run `npm run build` after significant changes to catch type errors early.
- Always scope database queries by the authenticated `userId`.
- Never expose secrets (PATs, API keys) in client-side code or responses.
- Test both light and dark mode when touching UI.
