# SpendWise

A collaborative expense tracker with multi-user workspaces, scheduled exports, and shareable reports. Built with Next.js 14, Prisma, and NextAuth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router, `src/` directory) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database ORM | [Prisma 5](https://www.prisma.io) |
| Database (dev) | SQLite (`prisma/dev.db`) |
| Database (prod) | PostgreSQL (swap one line in `schema.prisma`) |
| Auth | [NextAuth 4](https://next-auth.js.org) — credentials + JWT strategy |
| Charts | Recharts |
| Icons | Lucide React |
| Date handling | date-fns |

---

## Getting Started

### Prerequisites

- Node.js 20.x (`node -v` to check)
- npm

### 1. Install dependencies

```bash
cd Expense-Tracker
npm install
```

### 2. Set up the environment file

Create `.env` in the project root:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-at-least-32-chars-long"
```

> Generate a strong secret: `openssl rand -base64 32`

### 3. Create the database

```bash
npx prisma db push
```

This creates `prisma/dev.db` and generates the Prisma Client. Run this again whenever `schema.prisma` changes.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/register` to create your first account.

---

## Project Structure

```
src/
├── app/
│   ├── api/                    # All API routes
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   ├── register/           # Account creation (public)
│   │   ├── workspaces/         # Workspace CRUD + member management
│   │   ├── expenses/           # Expense CRUD
│   │   ├── shared-links/       # Shareable report links
│   │   ├── schedules/          # Scheduled exports
│   │   └── export-history/     # Export audit log
│   ├── expenses/               # Expenses list page
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── share/[token]/          # Public shared report view (no auth required)
│   └── page.tsx                # Dashboard
├── components/
│   ├── Navbar.tsx              # Auth-aware nav with workspace switcher
│   ├── CloudExportPanel.tsx    # Export / schedule / share / history panel
│   ├── Providers.tsx           # SessionProvider + WorkspaceProvider wrapper
│   └── ...
├── contexts/
│   └── WorkspaceContext.tsx    # Workspace state (selected workspace, list)
├── hooks/
│   └── useExpenses.ts          # API-backed expense hook
├── lib/
│   ├── auth.ts                 # NextAuth config (authOptions)
│   ├── apiHelpers.ts           # requireAuth(), requireWorkspaceMember()
│   ├── prisma.ts               # Prisma client singleton
│   └── ...
├── middleware.ts               # Route protection (page routes only)
├── types/
│   └── next-auth.d.ts          # Session type augmentation
└── prisma/
    ├── schema.prisma           # Database schema
    └── dev.db                  # SQLite database (gitignored in production)
```

---

## How Auth Works

Authentication uses **NextAuth 4** with a **credentials provider** (email + password) and a **JWT session strategy**.

1. Passwords are hashed with `bcryptjs` (12 salt rounds) at registration.
2. `signIn("credentials", { email, password })` validates against the hash.
3. The JWT callback embeds `user.id` into the token; the session callback exposes it as `session.user.id`.
4. `src/middleware.ts` protects all page routes (redirects unauthenticated users to `/login`). API routes are **excluded from middleware** and enforce auth themselves.

### Auth config location

`src/lib/auth.ts` — import `authOptions` from here in any server-side code that needs `getServerSession(authOptions)`.

---

## How the Backend Works

All backend logic lives in `src/app/api/`. Each route file handles HTTP methods directly.

### Auth enforcement in API routes

Every protected route calls `requireAuth()` from `src/lib/apiHelpers.ts`:

```ts
const auth = await requireAuth();
if (isErrorResponse(auth)) return auth; // returns 401 if not signed in
// auth.userId is now available
```

Workspace-level access is checked with `requireWorkspaceMember()`:

```ts
const member = await requireWorkspaceMember(auth.userId, workspaceId);
if (isErrorResponse(member)) return member; // returns 403 if not a member
// member.role is "owner" | "member" | "viewer"
```

### API routes summary

| Route | Methods | Description |
|---|---|---|
| `/api/register` | `POST` | Create account + default workspace |
| `/api/workspaces` | `GET`, `POST` | List user's workspaces, create workspace |
| `/api/workspaces/[id]/members` | `GET`, `POST`, `DELETE` | List, invite by email, remove members |
| `/api/expenses` | `GET`, `POST` | List / create expenses (workspace-scoped) |
| `/api/expenses/[id]` | `PATCH`, `DELETE` | Update / delete expense |
| `/api/shared-links` | `GET`, `POST`, `PATCH` | List, create, revoke shareable links |
| `/api/shared-links/[token]` | `GET` | **Public** — view shared report, increments view count |
| `/api/schedules` | `GET`, `POST`, `PATCH`, `DELETE` | Manage scheduled exports |
| `/api/export-history` | `GET`, `POST`, `DELETE` | View and clear export log |

---

## Database

### Schema overview

```
User ──< WorkspaceMember >── Workspace
                                  │
                         ┌────────┼──────────┐
                         │        │           │
                      Expense SharedLink ScheduledExport
                                             ExportHistory
```

| Model | Purpose |
|---|---|
| `User` | Account — email, hashed password |
| `Workspace` | Team/project bucket that owns all data |
| `WorkspaceMember` | Join table with `role`: `owner`, `member`, `viewer` |
| `Expense` | A single expense entry, scoped to a workspace |
| `SharedLink` | Tokenised read-only link to a workspace's expenses |
| `ScheduledExport` | Recurring export job (daily/weekly/monthly/quarterly) |
| `ExportHistory` | Audit log of every export that was run |

### Accessing the database

**Prisma Studio** (visual GUI):

```bash
npx prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555) — browse and edit all tables.

**Direct SQLite access** (CLI):

```bash
sqlite3 prisma/dev.db
```

Useful commands inside the SQLite shell:

```sql
.tables                          -- list all tables
.schema Expense                  -- show table schema
SELECT * FROM User;
SELECT * FROM Expense WHERE workspaceId = '...';
.quit
```

**Resetting the database** (destructive — wipes all data):

```bash
rm prisma/dev.db
npx prisma db push
```

### Migrating schema changes

In development, just edit `prisma/schema.prisma` and run:

```bash
npx prisma db push
```

For production with PostgreSQL, use migrations instead:

```bash
npx prisma migrate dev --name describe-your-change
```

---

## Switching to PostgreSQL (Production)

1. Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/spendwise"
```

3. Push the schema:

```bash
npx prisma migrate deploy
```

---

## Key Features

### Workspaces
Multiple users can share a workspace. Roles control permissions:
- **owner** — full access, can invite/remove members, delete expenses
- **member** — can add and edit own expenses
- **viewer** — read-only access (blocked from creating expenses)

Invite teammates via email through `/api/workspaces/[id]/members`.

### Shareable Links
Generate a tokenised URL (`/share/<token>`) that lets anyone view a workspace's expense report — no account required. Links expire after 7 days and can be revoked. View counts are tracked.

### Scheduled Exports
Configure recurring exports (daily / weekly / monthly / quarterly) for any export template and destination. Stored in `ScheduledExport` with a computed `nextRun` date.

### Export History
Every export is logged to `ExportHistory` with template name, destination, format, record count, and file size estimate.

---

## Available Scripts

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint

npx prisma studio          # Visual database browser
npx prisma db push         # Sync schema to DB (dev)
npx prisma migrate deploy  # Apply migrations (prod)
npx prisma generate        # Regenerate Prisma Client after schema changes
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite: `file:./dev.db` — Postgres: connection string |
| `NEXTAUTH_URL` | ✅ | Full URL of your app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ✅ | Random string ≥ 32 chars — sign JWTs and encrypt cookies |
