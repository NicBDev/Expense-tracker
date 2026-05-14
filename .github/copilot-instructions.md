# Copilot Instructions — SpendWise Expense Tracker

## Project Overview

Personal expense tracker built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**. No backend — all data lives in browser `localStorage`. Do not suggest adding a database, API routes, or authentication unless explicitly asked.

## Current Branch Context

- **`main`** — Clean baseline, no export feature
- **`feature-data-export-v1`** — Minimal CSV export inline button (complete)
- **`feature-data-export-v2`** — Advanced export modal (active, complete)

When helping on a feature branch, stay consistent with the approach already established on that branch.

## Architecture Conventions

- **App Router only** — no `pages/` directory
- All pages and components use `"use client"` where state/effects are needed
- Data flow: `localStorage` → `useExpenses` hook → page components → UI
- No server actions, no API routes, no external data fetching
- Tailwind utility classes only — no CSS modules, no styled-components

## Key Files

| File | Role |
|---|---|
| `src/types/index.ts` | All shared types (`Expense`, `Category`, `FilterState`, etc.) |
| `src/lib/storage.ts` | localStorage CRUD — `loadExpenses`, `saveExpenses`, `addExpense`, `updateExpense`, `deleteExpense` |
| `src/lib/utils.ts` | `formatCurrency`, `formatDate`, `computeStats`, `generateId`, `exportToCSV` (legacy v1), `CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_ICONS` |
| `src/lib/exportUtils.ts` | Export pipeline: `applyExportFilters`, `exportCSV`, `exportJSON`, `exportPDF`, `runExport` — plus types `ExportFormat`, `ExportFilters`, `ExportConfig` |
| `src/hooks/useExpenses.ts` | `useExpenses()` for CRUD, `useFilteredExpenses()` for filtered/sorted views |
| `src/components/ExportModal.tsx` | Full export modal — format picker, date range, category pills, preview table, filename input. **Mounted on the dashboard page only** (`src/app/page.tsx`). |

## Type Reference

```typescript
type Category = "Food" | "Transportation" | "Entertainment" | "Shopping" | "Bills" | "Travel" | "Other";

interface Expense {
  id: string;        // generated via generateId() from utils.ts
  date: string;      // ISO format: YYYY-MM-DD
  amount: number;
  category: Category;
  description: string;
  createdAt: string; // ISO timestamp
}

// Export types — defined in src/lib/exportUtils.ts
type ExportFormat = "csv" | "json" | "pdf";

interface ExportFilters {
  startDate: string;   // YYYY-MM-DD or ""
  endDate: string;     // YYYY-MM-DD or ""
  categories: Category[]; // empty = all categories
}

interface ExportConfig {
  format: ExportFormat;
  filename: string;
  filters: ExportFilters;
}
```

> **Note:** `exportToCSV()` in `utils.ts` is the original v1 inline export. The v2 `ExportModal` uses `exportUtils.ts` instead. Prefer `exportUtils.ts` for any new export work.

## UI Patterns

- **Modals**: Fixed overlay with `backdrop-blur-sm`, rounded-2xl card, click-outside to close, Escape key to close
- **Toasts**: Bottom-right, dark background, 3s auto-dismiss
- **Loading states**: `border-t-transparent` spinning ring using Tailwind
- **Category pills**: Rounded-full buttons with `indigo-600` active state
- **Color palette**: `indigo-600` primary, `slate-*` neutrals, `red-600` destructive

## DO / DON'T

**Do:**
- Use `lucide-react` for all icons
- Use `date-fns` for date formatting/parsing (already installed)
- Keep new components in `src/components/`
- Keep utility functions in `src/lib/`
- Match existing Tailwind patterns when adding UI

**Don't:**
- Add new npm packages without being asked
- Use `any` TypeScript type — infer or use existing types
- Create summary/changelog markdown files after making changes
- Add API routes or server-side data fetching
