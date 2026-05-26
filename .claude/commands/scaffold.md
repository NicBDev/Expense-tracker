Scaffold a new full-stack feature for SpendWise following project conventions: $ARGUMENTS

The feature name is provided in $ARGUMENTS (e.g. "budget-alerts" or "recurring-expenses").

Generate the following files, strictly following SpendWise conventions from CLAUDE.md:

1. **API Route** — `src/app/api/[feature-name]/route.ts`
   - GET and POST handlers (add others only if clearly needed)
   - Use `requireAuth()` and `requireWorkspaceMember()` from `src/lib/apiHelpers.ts`
   - Short-circuit with `isErrorResponse()` after each auth check
   - All queries must be workspace-scoped (always include `workspaceId` in Prisma `where`)
   - Return typed JSON responses; never expose raw Prisma errors

2. **Hook** — `src/hooks/use[FeatureName].ts`
   - Fetches from the API route above, passing `workspaceId` from `WorkspaceContext`
   - Exposes data, loading state, error state, and any mutation functions (create, update, delete)
   - Follow the pattern in `src/hooks/useExpenses.ts`

3. **Component** — `src/components/[FeatureName].tsx`
   - `"use client"` directive at top
   - Consumes the hook above
   - Uses `lucide-react` for icons, Tailwind utility classes only (no CSS modules)
   - Loading skeleton and empty state included
   - Color palette: `indigo-600` primary, `slate-*` neutrals, `red-600` destructive

4. **Prisma model snippet** — print to the console (don't edit schema.prisma automatically)
   - Suggest the Prisma model definition needed, workspace-scoped via a relation to `Workspace`
   - Remind the user to run `npx prisma db push` after adding it

After generating the files, print a summary checklist:
- [ ] Prisma model added to schema.prisma
- [ ] `npx prisma db push` run
- [ ] `npx prisma generate` run (if using a new model)
- [ ] New route added to any navigation components if needed
