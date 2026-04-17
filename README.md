# DevPulse

A private, single-user developer dashboard that aggregates GitHub activity, personal tasks, weather, and news into one place. Built with Next.js 16, React 19, and Tailwind CSS 4.

## Features

- **Task Management** — Create, edit, and organize tasks by status (TODO / In Progress / Done) and priority (Low / Medium / High). Group tasks into color-coded projects.
- **GitHub Activity** — View your profile, repositories, and recent activity using a Personal Access Token.
- **Weather Forecast** — Current conditions and hourly forecast via [WeatherAPI.com](https://www.weatherapi.com/).
- **News Feed** — Personalized article feed powered by [NewsAPI](https://newsapi.org/).
- **Secure Credential Storage** — API keys and PATs are encrypted with AES-256-GCM before being stored in the database.
- **Dark Mode** — Automatic theme switching based on system preference.
- **Responsive** — Mobile-first layout with a collapsible sidebar.

## Tech Stack

| Layer     | Technology                                                  |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 16.2.4 (App Router, Server Components)             |
| Language  | TypeScript 5 (strict mode)                                  |
| React     | React 19                                                    |
| Styling   | Tailwind CSS 4                                              |
| Auth      | NextAuth v5 (Auth.js) — Credentials provider               |
| Database  | Prisma ORM + libsql — local SQLite file / Turso remote     |
| Deploy    | Vercel                                                      |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database — local SQLite for development
DATABASE_URL="file:./dev.db"

# Auth — generate with: openssl rand -base64 32
AUTH_SECRET="your-auth-secret"

# Encryption — generate with: openssl rand -hex 32
ENCRYPTION_KEY="your-64-char-hex-key"
```

> **Note:** GitHub PAT, WeatherAPI key, and NewsAPI key are configured per-user in the Settings page — they are _not_ environment variables.

### 3. Set up the database

```bash
npm run db:migrate
npm run db:seed
```

The seed script creates a default user:

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `admin@devpulse.local` |
| Password | `devpulse123`          |

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the seed credentials.

## Scripts

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `npm run dev`      | Start development server (Turbopack)|
| `npm run build`    | Production build                    |
| `npm run start`    | Start production server             |
| `npm run lint`     | Run ESLint                          |
| `npm run db:seed`  | Seed the database with default user |
| `npm run db:migrate` | Run Prisma migrations             |
| `npm run db:studio`  | Open Prisma Studio                |

## Project Structure

```
dev-pulse/
├── proxy.ts                          # Route protection (Next.js 16 convention)
├── auth.ts                           # NextAuth v5 config
├── lib/
│   ├── db.ts                         # Prisma singleton client
│   └── crypto.ts                     # AES-256-GCM encrypt/decrypt
├── prisma/
│   ├── schema.prisma                 # Data models
│   └── seed.ts                       # Database seeder
├── app/
│   ├── layout.tsx                    # Root layout (fonts, metadata)
│   ├── globals.css                   # Tailwind theme + CSS variables
│   ├── (auth)/
│   │   └── login/page.tsx            # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar + session guard
│   │   ├── page.tsx                  # Dashboard home (widget grid)
│   │   ├── tasks/page.tsx            # Full task manager
│   │   └── settings/page.tsx         # API keys & preferences
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── tasks/route.ts            # GET / POST
│       ├── tasks/[id]/route.ts       # PATCH / DELETE
│       ├── projects/route.ts         # GET / POST
│       ├── projects/[id]/route.ts    # DELETE
│       ├── github/route.ts           # GitHub API proxy
│       ├── weather/route.ts          # WeatherAPI proxy
│       ├── news/route.ts             # NewsAPI proxy
│       └── settings/route.ts         # User settings CRUD
└── components/
    ├── Sidebar.tsx                   # Responsive navigation
    ├── TasksWidget.tsx               # Dashboard task summary
    ├── TaskModal.tsx                 # Create/edit task form
    ├── GitHubWidget.tsx              # GitHub profile + repos
    ├── WeatherWidget.tsx             # Weather conditions + forecast
    └── NewsWidget.tsx                # Article feed
```

## Data Models

- **User** — Email/password authentication, owns tasks, projects, and settings.
- **Task** — Title, description, status (`TODO` | `IN_PROGRESS` | `DONE`), priority (`LOW` | `MEDIUM` | `HIGH`), optional due date and project assignment.
- **Project** — Named grouping for tasks with a customizable color.
- **UserSettings** — Per-user storage for GitHub PAT, GitHub username, weather city, API keys (all encrypted at rest).

## Security

- All external API calls (GitHub, Weather, News) are proxied through server-side route handlers — API keys never reach the client.
- Stored secrets are encrypted with AES-256-GCM using the `ENCRYPTION_KEY` environment variable.
- All database queries are scoped by the authenticated user's ID.
- `proxy.ts` enforces authentication on all dashboard routes.

## Deploy on Vercel

1. Push the repo to GitHub.
2. Import the project on [Vercel](https://vercel.com/new).
3. Set the environment variables (`DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`) in the Vercel dashboard.
4. For production, use a [Turso](https://turso.tech/) database and set `DATABASE_URL` to the libsql remote URL.

## License

Private project — not licensed for redistribution.
