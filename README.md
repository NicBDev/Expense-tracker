# SpendWise — Expense Tracker

A personal expense tracking app built with Next.js 14, TypeScript, and Tailwind CSS. All data is stored locally in the browser via `localStorage` — no backend or database required.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Date utils | date-fns |
| Storage | Browser `localStorage` |

## Features

- Add, edit, and delete expenses with category, amount, date, and description
- Dashboard with summary cards, monthly spending chart, and category breakdown
- Expenses page with filtering (search, category, date range), sorting, and pagination
- Category color coding and emoji icons
- Responsive layout with sticky navbar

### Data Export (feature branches)

| Branch | Approach | Formats |
|---|---|---|
| `feature-data-export-v1` | Inline CSV button on the Expenses page | CSV only |
| `feature-data-export-v2` | Full export modal with filtering + preview | CSV, JSON, PDF |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── layout.tsx            # Root layout + Navbar
│   ├── globals.css
│   └── expenses/
│       └── page.tsx          # Expenses list + management
├── components/
│   ├── Navbar.tsx
│   ├── SummaryCards.tsx
│   ├── SpendingChart.tsx
│   ├── CategoryChart.tsx
│   ├── ExpenseForm.tsx       # Add/edit slide-over form
│   ├── ExpenseList.tsx       # Sortable expense table
│   ├── FilterBar.tsx
│   └── ExportModal.tsx       # Advanced export (v2)
├── hooks/
│   └── useExpenses.ts        # useExpenses + useFilteredExpenses
├── lib/
│   ├── storage.ts            # localStorage CRUD
│   ├── utils.ts              # Formatting, stats, constants
│   └── exportUtils.ts        # CSV / JSON / PDF export logic (v2)
└── types/
    └── index.ts              # Expense, Category, FilterState, etc.
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Use a real browser (Chrome, Safari, Firefox). The VS Code Simple Browser blocks `localStorage` and client-side navigation.

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable baseline — no export feature |
| `feature-data-export-v1` | Simple CSV export button |
| `feature-data-export-v2` | Advanced export modal (active development) |

## Categories

`Food` · `Transportation` · `Entertainment` · `Shopping` · `Bills` · `Travel` · `Other`
