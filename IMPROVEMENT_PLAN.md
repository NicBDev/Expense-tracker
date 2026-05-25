# SpendWise — Improvement Plan

> Generated from parallel backend + frontend analysis. Use this as a backlog reference.
> Last updated: 2026-05-23

---

## Quick Wins (High impact, low effort — do these first)

| Fix | Area | Effort | Priority |
|-----|------|--------|----------|
| Add Zod validation to all API routes | Backend | ~2h | 🔴 Critical |
| Add DB indexes to schema.prisma | Backend | ~15min | 🔴 Critical |
| Add rate limiting middleware | Backend | ~1h | 🔴 Critical |
| Error toasts on all failed API calls | Frontend | ~30min | 🔴 Critical |
| ARIA labels on all interactive elements | Frontend | ~1-2h | 🔴 Critical |
| Debounce search filter input | Frontend | ~15min | 🟠 High |
| Memoize components + computeStats | Frontend | ~1-2h | 🟠 High |
| Pagination on expense list endpoints | Backend | ~1h | 🟠 High |
| Standardize API response envelope | Backend | ~1h | 🟠 High |

---

## Backend Issues

### 🔴 Critical

#### 1. No Input Validation
- **Files**: All `src/app/api/**/route.ts`
- **Issue**: No Zod/Joi — email format, ISO date, category enum, amount precision all unvalidated
- **Fix**: Add Zod schemas to every route handler
```typescript
const ExpenseSchema = z.object({
  workspaceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive().max(999999.99),
  category: z.enum(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Travel', 'Other']),
  description: z.string().min(1).max(500),
});
```

#### 2. No Rate Limiting
- **Files**: All endpoints, especially `src/app/api/register/route.ts`, `src/lib/auth.ts`
- **Issue**: Login, register, and all mutations wide open to brute force
- **Fix**: Add rate limiting middleware (e.g. `@upstash/ratelimit` or `express-rate-limit`)

#### 3. Insecure Session Config
- **Files**: `src/lib/auth.ts`, `.env`
- **Issue**: No login attempt lockout, no JWT `maxAge`, dev secret in repo
- **Fix**: Add attempt tracking + lockout; set `maxAge`; use env-specific secrets

#### 4. N+1 Queries
- **Files**: `src/app/api/expenses/route.ts:19-23`, `src/app/api/shared-links/[token]/route.ts:24-28`
- **Issue**: Fetches user record for every expense row
- **Fix**: Use pagination; denormalize creator name if needed

#### 5. Auth Order Bug in Expense Update/Delete
- **Files**: `src/app/api/expenses/[id]/route.ts:10-20`
- **Issue**: Fetches expense before checking auth — leaks whether an ID exists
- **Fix**: Include workspace auth filter in the `where` clause of the initial query

---

### 🟠 High

#### 6. Missing Database Indexes
- **Files**: `prisma/schema.prisma`
- **Issue**: No indexes on frequently queried fields — full table scans on every request
- **Fix**:
```prisma
model Expense {
  @@index([workspaceId])
  @@index([userId])
  @@index([workspaceId, date])
}
model WorkspaceMember {
  @@index([workspaceId])
}
model ScheduledExport {
  @@index([workspaceId])
}
model SharedLink {
  @@index([workspaceId])
}
```

#### 7. Shared Link Abuse Vectors
- **Files**: `src/app/api/shared-links/[token]/route.ts`
- **Issue**: No rate limiting on token endpoint; view count can be hammered; no access logging
- **Fix**: Rate limit per IP; add access log; validate token format before DB query

#### 8. Inconsistent API Response Shapes
- **Files**: All route handlers
- **Issue**: Error/success envelopes differ per route
- **Fix**: Standardize:
```typescript
{ success: true, data: {...} }      // success
{ success: false, error: "code", message: "..." }  // error
```

#### 9. No Pagination
- **Files**: `src/app/api/expenses/route.ts`, `src/app/api/shared-links/route.ts`, `src/app/api/schedules/route.ts`
- **Issue**: All rows returned with no limit/offset; `/api/export-history` hardcoded at `take: 50`
- **Fix**: Add `?limit=` and `?offset=` query params with defaults and max caps

#### 10. Token Format Not Validated
- **Files**: `src/app/api/shared-links/[token]/route.ts`
- **Issue**: Malformed tokens hit the DB instead of returning early
- **Fix**: `if (!/^[A-Za-z0-9_-]{32}$/.test(params.token)) return 400`

---

### 🟡 Medium

#### 11. No CSRF Protection on Mutations
- **Fix**: Validate NextAuth CSRF tokens in API routes; use `SameSite` cookie flags

#### 12. No Audit Logging
- **Issue**: No record of who changed what — can't detect abuse or debug
- **Fix**: Add `AuditLog` model; log all mutations with before/after state

#### 13. Weak Password Requirements
- **Files**: `src/app/api/register/route.ts:12`
- **Issue**: Only 8 chars minimum
- **Fix**: Require uppercase + number; use zxcvbn for strength estimation

#### 14. No Request Body Size Limits
- **Fix**: Configure Next.js middleware with body size limits

#### 15. Workspace Count Queries Re-aggregate on Every Request
- **Files**: `src/app/api/workspaces/route.ts:14-18`
- **Fix**: Cache counts or denormalize `expenseCount`/`memberCount` as columns

#### 16. Hard Deletes Everywhere
- **Fix**: Add `deletedAt DateTime?` to Expense, SharedLink, ScheduledExport; filter by default

---

### 🟢 Low

- No API documentation / JSDoc on routes
- No optimistic locking for concurrent edits (add `version` field)
- Missing Content-Security-Policy headers
- Error stack traces may leak to production console logs

---

## Frontend Issues

### 🔴 Critical

#### 1. Silent API Errors
- **Files**: `src/hooks/useExpenses.ts:18-40`, `src/components/Navbar.tsx:31-49`, `src/components/WorkspaceMembersModal.tsx:71-92`
- **Issue**: All API errors swallowed silently — users get false sense of success
- **Fix**: Wrap all fetches in try-catch; show error toasts on failure

#### 2. Race Conditions in Expense Fetching
- **Files**: `src/hooks/useExpenses.ts:18-40`
- **Issue**: Rapid workspace switching causes overlapping fetches with no cancellation
- **Fix**: Implement `AbortController`; cancel previous request in `useEffect` cleanup

#### 3. Zero Accessibility (WCAG 2.1)
- **Files**: All components
- **Issues**:
  - Modals lack `role="dialog"`, `aria-modal`, `aria-labelledby`
  - Icon-only buttons have no `aria-label`
  - No focus trap in modals
  - No skip-to-content link
  - Dropdowns not ARIA-compliant
- **Fix**: Add ARIA attributes; use `focus-trap-react`; semantic HTML throughout

#### 4. No Network Feedback on Mutations
- **Files**: `src/hooks/useExpenses.ts`, `src/app/expenses/page.tsx`
- **Issue**: Add/edit/delete show no loading indicator during actual network time (fake 300ms delay only)
- **Fix**: Add loading state to mutation functions; show spinners on affected rows/buttons

---

### 🟠 High

#### 5. No Optimistic Updates
- **Files**: `src/hooks/useExpenses.ts:47-98`
- **Issue**: All mutations wait for server before updating UI — users feel lag
- **Fix**: Update local state immediately; rollback on error

#### 6. Missing Memoization
- **Files**: `src/components/SummaryCards.tsx`, `src/components/CategoryChart.tsx`, `src/components/ExpenseList.tsx`
- **Issue**: Components recompute on every parent render; no `React.memo`
- **Fix**: Wrap with `React.memo`; `useCallback` for handlers; `useMemo` for derived data

#### 7. `computeStats` Makes 3 Passes Over All Expenses
- **Files**: `src/lib/utils.ts:45-87`
- **Fix**: Consolidate into single reduce pass

#### 8. No Search Debounce
- **Files**: `src/components/FilterBar.tsx:28`
- **Issue**: Every keystroke triggers full re-filter
- **Fix**: 300ms debounce on search input

#### 9. No Pagination / Virtualization
- **Files**: `src/components/ExpenseList.tsx`
- **Issue**: All expenses rendered as DOM nodes; degrades with large lists
- **Fix**: Add pagination or `react-window` virtual scrolling for lists >100 items

#### 10. Recharts Bundle Not Code-Split
- **Files**: All chart components
- **Issue**: ~200KB unshared; all 5 chart components import independently
- **Fix**: Lazy-load chart components with `dynamic(() => import(...), { ssr: false })`

#### 11. Uncontrolled Modal Stack
- **Files**: `src/app/expenses/page.tsx:132-197`
- **Issue**: Multiple overlapping modals possible; no z-index system
- **Fix**: Modal context/provider; centralized z-index management

---

### 🟡 Medium

- No skeleton screens — only spinners (add progressive loading)
- No error toasts — only success toasts exist
- Timezone bugs in date handling (date input assumes local time)
- Mobile nav gaps — logo hidden on mobile but no hamburger menu
- No undo after delete (show "Undo" for 5s)
- Filter state resets on page reload (persist to URL query params)
- Missing confirmation dialogs on destructive operations (clear history, delete workspace)
- `WorkspaceContext` refresh function recreated unnecessarily on every status change

---

### 🟢 Low

- No bulk actions (select all, bulk delete)
- Hardcoded magic numbers and delays (`300`, `3000`)
- Empty states don't distinguish "no data" vs "no results from filter"
- No category autocomplete / quick-filter buttons
- No keyboard shortcuts (Cmd+S, consistent Escape handling)
- Navbar workspace dropdown overflow on long names

---

## Suggested Implementation Sprints

### Sprint 1 — Security & Stability (Backend)
- Zod validation on all routes
- DB indexes
- Rate limiting
- Auth order fix in `expenses/[id]`

### Sprint 2 — UX Fundamentals (Frontend)
- Error toasts on all API calls
- Search debounce
- Memoization pass (React.memo + useMemo)
- Loading states on mutations

### Sprint 3 — Performance
- Pagination (backend + frontend)
- Lazy-load Recharts
- Single-pass computeStats
- AbortController in useExpenses

### Sprint 4 — Polish
- Accessibility (ARIA, focus trap, skip link)
- Skeleton screens
- Soft deletes
- Filter state persistence to URL
- Audit logging
