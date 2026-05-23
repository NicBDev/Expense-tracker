# Technical Documentation: V3 Full Backend

## Overview

`feature-v3-backend` is a full-stack upgrade that replaces the previous localStorage-based expense tracker with a persistent, multi-user backend using **Prisma ORM**, **NextAuth.js**, and a **SQLite** database (production-ready to swap to PostgreSQL). It introduces workspace collaboration, token-based shared links, scheduled exports, and full REST API coverage.

**Type:** Full-stack (backend-heavy, with frontend updates)  
**Branch:** `feature-v3-backend`  
**Key commit:** `b322389 feat: V3 full backend`

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   ├── expenses/
│   │   │   ├── route.ts                  # GET (list), POST (create)
│   │   │   └── [id]/route.ts             # PUT, DELETE by id
│   │   ├── register/route.ts             # User registration
│   │   ├── workspaces/
│   │   │   ├── route.ts                  # GET, POST workspaces
│   │   │   └── [id]/members/route.ts     # Manage workspace members
│   │   ├── shared-links/
│   │   │   ├── route.ts                  # Create/list shared links
│   │   │   └── [token]/route.ts          # Resolve token → expenses
│   │   ├── schedules/route.ts            # Scheduled exports CRUD
│   │   └── export-history/route.ts       # Export history log
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── share/[token]/page.tsx            # Public shared view
├── lib/
│   ├── auth.ts                           # NextAuth authOptions
│   ├── prisma.ts                         # Prisma client singleton
│   ├── apiHelpers.ts                     # Shared fetch wrappers
│   └── cloudExport.ts                    # Export destination logic
├── middleware.ts                          # Protects page routes only
├── contexts/WorkspaceContext.tsx          # Active workspace state
└── types/next-auth.d.ts                  # Session type augmentation
```

---

## Database Schema

Managed via Prisma. Schema at `prisma/schema.prisma`. Default provider: `sqlite`. Change to `postgresql` for production.

| Model | Purpose |
|---|---|
| `User` | Authentication, profile |
| `Account` / `Session` / `VerificationToken` | NextAuth required models |
| `Workspace` | Multi-user expense grouping |
| `WorkspaceMember` | User ↔ Workspace with role (`owner`/`member`) |
| `Expense` | Core expense record, scoped to workspace + user |
| `SharedLink` | Token-based public share with expiry and view count |
| `ScheduledExport` | Recurring export config per workspace |
| `ExportHistory` | Audit log of past exports |

---

## Authentication

Uses **NextAuth.js** with credentials provider (email + bcrypt password).

- Config: [`src/lib/auth.ts`](../../src/lib/auth.ts)
- Handler: [`src/app/api/auth/[...nextauth]/route.ts`](../../src/app/api/auth/%5B...nextauth%5D/route.ts)
- Session includes `user.id` via type augmentation in [`src/types/next-auth.d.ts`](../../src/types/next-auth.d.ts)
- Middleware at [`src/middleware.ts`](../../src/middleware.ts) protects page routes only; API routes enforce auth internally

---

## API Endpoints

### Expenses
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/expenses` | ✅ | List expenses for active workspace |
| POST | `/api/expenses` | ✅ | Create expense |
| PUT | `/api/expenses/[id]` | ✅ | Update expense |
| DELETE | `/api/expenses/[id]` | ✅ | Delete expense |

### Workspaces
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/workspaces` | ✅ | List user's workspaces |
| POST | `/api/workspaces` | ✅ | Create workspace |
| POST | `/api/workspaces/[id]/members` | ✅ | Add member by email |

### Shared Links
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/shared-links` | ✅ | List workspace shared links |
| POST | `/api/shared-links` | ✅ | Create token with expiry |
| GET | `/api/shared-links/[token]` | ❌ | Public: resolve token → expenses |

### Other
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | ❌ | Register new user |
| GET/POST | `/api/schedules` | ✅ | Manage scheduled exports |
| GET | `/api/export-history` | ✅ | View export history |

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"         # SQLite (dev)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Apply schema to DB
npx prisma db push

# Open Prisma Studio (optional)
npx prisma studio
```

---

## Switching to PostgreSQL (Production)

1. In `prisma/schema.prisma`, change `provider = "sqlite"` → `provider = "postgresql"`
2. Update `DATABASE_URL` to your PostgreSQL connection string
3. Run `npx prisma migrate deploy`

---

## Related Documentation

- [User Guide: V3 Backend Features](../user/how-to-feature-v3-backend.md)
- [Prisma Schema](../../prisma/schema.prisma)
- [NextAuth Docs](https://next-auth.js.org/)
