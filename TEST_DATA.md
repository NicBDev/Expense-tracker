# SpendWise — Test Account Reference

> All accounts were created via `POST /api/register` and are available on the local dev server at **http://localhost:3002**.
> To seed expenses for any account, update and re-run `scripts/seed-test-data.mjs`.

---

## Test Accounts

| # | Name | Email | Password | Role | Workspace |
|---|------|-------|----------|------|-----------|
| 1 | Test User 1 | testuser1@spendwise.dev | Password1123! | Owner | Test User 1's Workspace |
| 2 | Test User 2 | testuser2@spendwise.dev | Password2123! | Owner | Test User 2's Workspace |
| 3 | Test User 3 | testuser3@spendwise.dev | Password3123! | Owner | Test User 3's Workspace |
| 4 | Test User 4 | testuser4@spendwise.dev | Password4123! | Owner | Test User 4's Workspace |
| 5 | Test User 5 | testuser5@spendwise.dev | Password5123! | Owner | Test User 5's Workspace |

---

## Seeded Expense Data

| Account | Expenses | Categories | Date Range |
|---------|----------|------------|------------|
| Test User 1 | 30 | Food & Dining, Transport, Shopping, Utilities, Entertainment, Health, Travel, Education | Last 90 days |
| Test User 2 | 25 | Food & Dining, Transport, Shopping, Utilities, Entertainment, Health, Travel, Education | Last 90 days |
| Test User 3 | None | — | — |
| Test User 4 | None | — | — |
| Test User 5 | None | — | — |

Amounts range from **$4.50 – $450.00** per expense (randomised).

---

## Workspace Membership

By default each user owns their own personal workspace. To test collaboration features (invite, roles, remove):

1. Log in as **Test User 1** at http://localhost:3002/login
2. Click the workspace switcher in the top-left navbar
3. Select **Manage Members**
4. Invite any of the accounts below with a `member` or `viewer` role

### Suggested role-testing setup

| Invited user | Suggested role | What to test |
|---|---|---|
| testuser2@spendwise.dev | `member` | Can add/edit expenses, can invite others |
| testuser3@spendwise.dev | `viewer` | Read-only — cannot add or edit expenses |

---

## Quick Login Reference

```
testuser1@spendwise.dev  /  Password1123!   ← has 30 expenses
testuser2@spendwise.dev  /  Password2123!   ← has 25 expenses
testuser3@spendwise.dev  /  Password3123!   ← empty (good for invite testing)
testuser4@spendwise.dev  /  Password4123!   ← empty
testuser5@spendwise.dev  /  Password5123!   ← empty
```

---

## Re-seeding

If the database is reset (`rm prisma/dev.db && npx prisma db push`), re-register and re-seed:

```bash
# 1. Re-register all 5 accounts
for i in 1 2 3 4 5; do
  curl -s -X POST http://localhost:3002/api/register \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Test User $i\", \"email\": \"testuser${i}@spendwise.dev\", \"password\": \"Password${i}123!\"}" | jq .
done

# 2. Re-seed expenses for users 1 and 2
node scripts/seed-test-data.mjs
```

---

*Last updated: 2026-05-23*
