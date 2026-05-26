Reset the SpendWise dev database to a clean, seeded state.

Follow these steps exactly:

1. **Warn before proceeding** — Print: "⚠️  This will delete all local dev data. Proceeding in 3 seconds..." then continue.

2. **Delete the dev database**
   ```bash
   rm -f prisma/dev.db
   ```

3. **Push the current schema**
   ```bash
   npx prisma db push
   ```

4. **Check for a seed script** — Look for `prisma/seed.ts` or `prisma/seed.js`, or a `"seed"` script in `package.json`.
   - If found, run it: `npx prisma db seed`
   - If not found, check the most recent commit messages or the file `prisma/` directory for any seed-related files
   - If a seed file exists but isn't wired into package.json, run it directly with `npx tsx prisma/seed.ts` (or `node prisma/seed.js`)

5. **Verify the reset** — Run a quick Prisma query count to confirm tables exist and seed data is present:
   ```bash
   npx prisma studio --browser none &
   ```
   Or just print the row counts using a short Node script via `npx tsx` if possible.

6. **Print a success summary**:
   - Schema pushed ✓
   - Seed data loaded ✓ (or "No seed script found — database is empty but schema is ready")
   - Reminder: `npx prisma studio` to browse the data visually
