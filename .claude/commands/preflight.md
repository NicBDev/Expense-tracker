Run a pre-merge readiness check on the current branch for SpendWise.

You are a thorough code reviewer. Run each check below in order, report results, and produce a final pass/fail summary.

---

## 1. TypeScript
```bash
npx tsc --noEmit
```
Report: number of errors, or "✓ No TypeScript errors"

## 2. ESLint
```bash
npm run lint
```
Report: any warnings or errors found, or "✓ Lint clean"

## 3. Production Build
```bash
npm run build
```
Report: success or any build errors. Note any warnings about bundle size or missing env vars.

## 4. Auth Pattern Audit
Scan every file in `src/app/api/` that was added or modified in this branch (`git diff --name-only main`).
For each API route file, verify:
- [ ] `requireAuth()` is called and its result is checked with `isErrorResponse()`
- [ ] `requireWorkspaceMember()` is called for any workspace-scoped operation
- [ ] No route returns data without an auth check
- [ ] No raw `prisma.*` calls that omit `workspaceId` in the `where` clause

Flag any violations as **FAIL** items.

## 5. Shared Link Safety
Check `src/app/share/` and `src/app/api/shared-links/` for any changes.
If modified, verify:
- [ ] No session/auth data leaks into the public shared response
- [ ] Only expense data explicitly intended for sharing is returned

## 6. Type Safety Spot-Check
Scan modified `.ts` / `.tsx` files for:
- Any use of `any` (TypeScript strict mode violation)
- Any `// @ts-ignore` or `// @ts-expect-error` comments added

---

## Final Summary

Print a table:

| Check              | Status |
|--------------------|--------|
| TypeScript         | ✓ / ✗ |
| ESLint             | ✓ / ✗ |
| Build              | ✓ / ✗ |
| Auth patterns      | ✓ / ✗ |
| Shared link safety | ✓ / ✗ |
| Type safety        | ✓ / ✗ |

**READY TO MERGE** if all checks pass.
**NOT READY** — list each failing check with a one-line fix recommendation.
