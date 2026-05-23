# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SpendWise** — a collaborative expense tracker with multi-user workspaces, shareable reports, and scheduled exports. Built with Next.js 14 App Router, Prisma (SQLite dev / PostgreSQL prod), and NextAuth 4.

## Common Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint

npx prisma db push         # Sync schema changes to SQLite (dev)
npx prisma generate        # Regenerate Prisma Client after schema changes
npx prisma studio          # Visual DB browser at http://localhost:5555
npx prisma migrate dev --name <name>  # Create a named migration (prod/PostgreSQL)

# Reset the dev database (destructive)
rm prisma/dev.db && npx prisma db push
```

There are no test files in this project.

## Architecture

### Tech Stack

- **Next.js 14** — App Router, `src/` directory, no `pages/`
- **TypeScript** — strict; never use `any`
- **Tailwind CSS v4** — utility classes only, no CSS modules
- **Prisma 5** + SQLite (dev) / PostgreSQL (prod, swap one line in `schema.prisma`)
- **NextAuth 4** — credentials provider, JWT session strategy
- **Recharts** for charts, **Lucide React** for icons, **date-fns** for dates

### Key Directories

```
src/
├── app/
│   ├── api/           # All API route handlers (HTTP methods)
│   ├── share/[token]/ # Public shared report (no auth)
│   └── page.tsx       # Dashboard (root)
├── components/        # Client components
├── contexts/
│   └── WorkspaceContext.tsx  # Global workspace state + selection
├── hooks/
│   └── useExpenses.ts # API-backed CRUD + filtering/sorting
├── lib/
│   ├── auth.ts        # NextAuth authOptions — import from here for getServerSession
│   ├── apiHelpers.ts  # requireAuth(), requireWorkspaceMember(), isErrorResponse()
│   ├── prisma.ts      # Prisma client singleton
│   └── cloudExport.ts # Export/schedule/share logic
├── types/
│   └── index.ts       # Shared types: Expense, Category, FilterState, SummaryStats
└── middleware.ts      # Protects page routes; API routes self-enforce auth
```

### Auth Flow

1. `src/middleware.ts` guards page routes — excludes `/api/`, `/login`, `/register`, `/share`.
2. Every protected API route calls `requireAuth()` → returns `{ userId }` or a `401` `NextResponse`.
3. Workspace access is checked via `requireWorkspaceMember(userId, workspaceId)` → returns `{ role }` or a `403`.
4. Use `isErrorResponse(val)` to short-circuit if either helper returned an error.
5. `authOptions` lives in `src/lib/auth.ts` — always import from there for `getServerSession(authOptions)`.

```ts
// Standard API route pattern
const auth = await requireAuth();
if (isErrorResponse(auth)) return auth;

const member = await requireWorkspaceMember(auth.userId, workspaceId);
if (isErrorResponse(member)) return member;
// member.role is "owner" | "member" | "viewer"
```

### Data Model

```
User ──< WorkspaceMember >── Workspace
                                  │
                     ┌────────────┼──────────────┐
                     │            │               │
                  Expense    SharedLink    ScheduledExport
                                              ExportHistory
```

All expenses and features are **workspace-scoped** — always pass `workspaceId` in queries. Roles control permissions: `owner` > `member` > `viewer` (viewers cannot create expenses).

### Client Data Flow

`WorkspaceContext` (fetches `/api/workspaces`, persists selection to `localStorage`) → `useExpenses` hook (fetches `/api/expenses?workspaceId=...`) → page/component.

### Shared Links

`/share/[token]` is fully public (no auth). The `SharedLink` model stores a unique token, expiry (7 days), view count, and active flag. The API at `/api/shared-links/[token]` increments views and returns expense data without requiring a session.

## UI Conventions

- **Icons**: `lucide-react` only
- **Dates**: `date-fns`
- **Color palette**: `indigo-600` primary, `slate-*` neutrals, `red-600` destructive
- **Modals**: fixed overlay with `backdrop-blur-sm`, rounded-2xl card, click-outside + Escape to close
- **Toasts**: bottom-right, dark background, 3s auto-dismiss

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | `file:./dev.db` (SQLite) or PostgreSQL connection string |
| `NEXTAUTH_URL` | App base URL, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random string ≥ 32 chars — generate with `openssl rand -base64 32` |

## Switching to PostgreSQL

Change `provider = "sqlite"` → `"postgresql"` in `prisma/schema.prisma`, update `DATABASE_URL`, then run `npx prisma migrate deploy`.
