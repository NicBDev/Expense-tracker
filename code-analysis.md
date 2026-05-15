# SpendWise Export Feature — Code Analysis

**Branches analysed:** `feature-data-export-v1`, `feature-data-export-v2`, `feature-data-export-v3`  
**Baseline:** `main` (no export functionality)  
**Analysis date:** May 14, 2026  
**Analyser:** GitHub Copilot

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Version 1 — Simple CSV Export](#version-1--simple-csv-export)
3. [Version 2 — Advanced Export Modal](#version-2--advanced-export-modal)
4. [Version 3 — Cloud-Integrated Export System](#version-3--cloud-integrated-export-system)
5. [Cross-Version Comparison](#cross-version-comparison)
6. [Combination Recommendation](#combination-recommendation)

---

## Executive Summary

| Dimension | V1 | V2 | V3 |
|---|---|---|---|
| Files changed vs main | 1 | 6 | 3 |
| Lines added | ~20 | ~968 | ~1,296 |
| New files created | 0 | 2 | 2 |
| Export formats | CSV only | CSV, JSON, PDF | CSV, JSON (PDF as CSV) |
| User interaction | 1-click | Modal w/ config | Slide-over panel w/ 4 tabs |
| Filtering | None | Date range + category | None (template-based presets) |
| Preview | None | Live paginated table | None |
| Persistence | None | None | localStorage history/schedules |
| Sharing | None | None | Links + QR codes |
| Scheduling | None | None | Daily/weekly/monthly/quarterly |
| Destinations | Download only | Download only | Email + 5 cloud services (simulated) |
| Complexity (LOC) | ~17 (function) | ~210 (lib) + ~538 (component) | ~350 (lib) + ~480 (component) |

---

## Version 1 — Simple CSV Export

### Files Created / Modified

| File | Change |
|---|---|
| `src/app/page.tsx` | Modified — added import, button UI |

No new files created. The implementation is entirely inline, delegating to `exportToCSV()` which already existed in `src/lib/utils.ts` on `main`.

### Code Architecture Overview

V1 applies the minimal-footprint principle: zero new abstraction, zero new files. The `exportToCSV()` function was pre-existing utility code in `src/lib/utils.ts`. V1 simply exposes it in the dashboard header via a conditionally-rendered button.

```
Dashboard page.tsx
    └── calls exportToCSV(expenses)   ← from src/lib/utils.ts (pre-existing)
```

### Key Components and Responsibilities

**`exportToCSV(expenses: Expense[]): void`** (in `src/lib/utils.ts`)

The entirety of v1's export logic lives in this 17-line function:

1. Builds a header row: `["Date", "Amount", "Category", "Description"]`
2. Maps each expense to a row array, double-quoting descriptions to handle commas
3. Joins everything with commas and newlines into a CSV string
4. Creates a `Blob` with `type: "text/csv"`
5. Uses `URL.createObjectURL()` + a synthetic `<a>` click to trigger download
6. Immediately calls `URL.revokeObjectURL()` to release memory

Notable omissions vs v2:
- No `document.body.appendChild/removeChild` around the anchor — the click fires on a detached element, which works in modern browsers but is technically non-standard
- Raw `e.date` string used (ISO format `yyyy-MM-dd`) rather than a formatted date
- No `ID` column — expense IDs are not exported
- Filename is always `expenses-YYYY-MM-DD.csv`, no user control

**Dashboard button (in `src/app/page.tsx`)**

```tsx
{expenses.length > 0 && (
  <button onClick={() => exportToCSV(expenses)}>
    <Download /> Export Data
  </button>
)}
```

Guard: button hidden when `expenses.length === 0`.

### Libraries and Dependencies Used

- `lucide-react`: `Download` icon  
- `date-fns`: `format()` (already imported in utils.ts)  
- No new dependencies introduced

### Implementation Patterns and Approaches

- **Imperative DOM manipulation** for file download (Blob URL + synthetic anchor click)
- **Zero state management** — no React state added at all
- **Zero async** — the function is synchronous; the download initiates instantly
- **Conditional rendering** of the button based on data availability

### Code Complexity Assessment

**Cyclomatic complexity:** 1 (single path through `exportToCSV`, no branches beyond the map)  
**Cognitive load:** Minimal. The feature is self-contained and readable in under 30 seconds.  
**Testing difficulty:** Low. `exportToCSV()` is a pure side-effect function; it can be tested by mocking `URL.createObjectURL` and checking the blob content.

### Error Handling

None. The function has no try/catch. Failure modes:
- `URL.createObjectURL` throwing (unlikely in browser context)
- Browser blocking the synthetic click (popup blocker) — silently fails with no user feedback

### Security Considerations

- **No XSS risk** from the CSV content itself; description values are double-quoted to prevent formula injection, but leading `=`, `+`, `-`, `@` characters are NOT stripped — a malicious description like `=HYPERLINK(...)` would be injected into the CSV. This is a low-risk concern for a local app with no server, but worth noting for any shared/multi-user context.
- No data leaves the browser (pure client-side download).

### Performance Implications

- Synchronous string construction: O(n) with expense count. For thousands of records this is imperceptible.
- `URL.createObjectURL()` creates an in-memory object URL that is immediately revoked — no memory leak.
- No rendering overhead — no modal, no re-renders.

### Extensibility and Maintainability

**Low extensibility.** Adding JSON export, date filtering, or a custom filename would require either modifying `exportToCSV()` (affecting any other callers) or adding a parallel function.  
**High maintainability** within its scope — there is nothing to maintain. The simplicity is its main asset.

### Technical Deep Dive

**How does the export work?**

```
User clicks button
  → exportToCSV(expenses) called synchronously
  → String built in memory
  → Blob created → object URL created
  → Detached <a> element clicked programmatically
  → Browser downloads file
  → Object URL revoked
```

**File generation:** In-memory string concatenation, no streaming, no workers.  
**User interaction:** Single click, zero confirmation, zero configuration.  
**State management:** None — expenses array passed directly from parent prop.  
**Edge cases handled:** Empty state (button hidden). Commas in descriptions (double-quoting). No handling for very large datasets.

---

## Version 2 — Advanced Export Modal

### Files Created / Modified

| File | Change | Type |
|---|---|---|
| `src/lib/exportUtils.ts` | Created | New library (~210 lines) |
| `src/components/ExportModal.tsx` | Created | New component (~538 lines) |
| `src/app/page.tsx` | Modified | Added modal state + trigger |
| `src/app/expenses/page.tsx` | Modified | Added modal (replaces old CSV button) |
| `.github/copilot-instructions.md` | Modified | Project docs |
| `README.md` | Modified | Project docs |

### Code Architecture Overview

V2 introduces a clean separation between export logic (`exportUtils.ts`) and export UI (`ExportModal.tsx`). The modal is opened from two independent surfaces — the dashboard and the expenses page — each passing their local `expenses` array.

```
src/app/page.tsx          →  <ExportModal expenses={expenses} />
src/app/expenses/page.tsx →  <ExportModal expenses={expenses} />
                                    ↓
                          src/lib/exportUtils.ts
                          ├── applyExportFilters()
                          ├── exportCSV()
                          ├── exportJSON()
                          ├── exportPDF()
                          └── runExport() (async orchestrator)
```

### Key Components and Responsibilities

**`src/lib/exportUtils.ts`**

| Export | Signature | Purpose |
|---|---|---|
| `ExportFormat` | `"csv" \| "json" \| "pdf"` | Union type for format selection |
| `ExportFilters` | `{ startDate, endDate, categories[] }` | Filter config passed by modal |
| `ExportConfig` | `{ format, filename, filters }` | Full export config object |
| `applyExportFilters()` | `(expenses, filters) → Expense[]` | Pure filter function |
| `exportCSV()` | `(expenses, filename) → void` | CSV generation + download |
| `exportJSON()` | `(expenses, filename) → void` | JSON generation + download |
| `exportPDF()` | `(expenses, filename) → void` | HTML print-to-PDF via browser |
| `runExport()` | `async (expenses, config) → void` | Async orchestrator with 600ms delay |
| `downloadBlob()` | `(content, filename, mime) → void` | Private blob download helper |

Key improvement over v1's `exportToCSV`:
- `downloadBlob` properly uses `document.body.appendChild/removeChild` around the `<a>` click for cross-browser safety
- `exportCSV` adds an `ID` column
- Dates are formatted via `date-fns` format() rather than raw ISO strings
- Descriptions use `replace(/"/g, '""')` for proper CSV escaping

**`exportPDF()`** is the most sophisticated function — it constructs a full HTML document string including computed category summary tables, styled with inline CSS, opens it in a new browser tab (`window.open`), and calls `window.print()` after a 400ms delay. This produces a "PDF" through the browser's native print-to-PDF dialog rather than a PDF library.

**`src/components/ExportModal.tsx`** (~538 lines)

A centered `max-w-3xl` modal with a fixed header, scrollable body, and sticky footer. Five distinct UI sections:

1. **Format picker** — three card buttons (CSV/JSON/PDF), each color-coded (emerald/blue/rose), with active state ring + checkmark.
2. **Date range** — two `<input type="date">` fields with `min`/`max` cross-linking to prevent invalid ranges.
3. **Category filter** — pill-toggle buttons for each category, "Select all / Deselect all" toggle, warning when none selected.
4. **Filename** — free-text `<input>` with live extension label appended.
5. **Data preview** — live paginated table (5 rows/page) showing filtered & sorted data. Toggle-able to hide.

Footer shows three summary pills (record count, total amount, format) and the primary Export CTA with disabled/loading/success states.

Key state variables in `ExportModal`:
```
format          ExportFormat     — selected export format
startDate       string           — ISO date filter start
endDate         string           — ISO date filter end
selectedCats    Category[]       — active category filter
filename        string           — output filename (no extension)
previewPage     number           — current preview pagination page
showPreview     boolean          — preview section visibility toggle
exporting       boolean          — async loading state
exported        boolean          — 3-second success flash state
```

All derived values (`filteredExpenses`, `totalAmount`, `previewSlice`, `totalPreviewPages`) are computed via `useMemo`, preventing redundant recalculation on unrelated re-renders.

### Libraries and Dependencies Used

- `date-fns`: `format()`, `parseISO()`
- `lucide-react`: 13 icons (X, FileText, FileJson, File, ChevronDown/Up, Check, Download, Eye, SlidersHorizontal, AlertCircle, CheckCircle2)
- `clsx`: Not used (plain template literals for conditional classes)
- No new npm packages

### Implementation Patterns

- **Controlled form pattern**: All filter state owned in `ExportModal`, not lifted to parent
- **Derived state via useMemo**: 4 separate `useMemo` hooks for filtered/sorted data, totals, preview slice, and page count
- **Optimistic callback memoisation**: `toggleCategory` wrapped in `useCallback` to prevent new function reference on each render
- **Async export with loading state**: `runExport()` is awaited inside a try/finally block — `exporting` always resets even on error
- **Keyboard accessibility**: Escape key closes modal via `useEffect` + `window.addEventListener`
- **Click-outside close**: `onClick` handler on the backdrop div checks `e.target === e.currentTarget`
- **Cross-modal reuse**: Same `ExportModal` component mounted identically from both `page.tsx` and `expenses/page.tsx`

### Code Complexity Assessment

**`exportUtils.ts`**: Moderate complexity. `exportPDF()` is the most complex function (HTML template construction with computed category grouping), but it's a single responsibility with clear input/output.  
**`ExportModal.tsx`**: High UI complexity. 538 lines, 8 state variables, 4 `useMemo`, 1 `useCallback`, 2 `useEffect`. However, the complexity is well-managed — each section of JSX corresponds to a distinct UI concern with no tangled conditionals.

### Error Handling

- `runExport()` uses try/finally to guarantee `setExporting(false)` is called — the only async error handling in the codebase
- `window.open()` in `exportPDF()` has a null guard: `if (!win) return` — handles popup-blocked scenario
- Empty-state guard: Export button is `disabled` when `filteredExpenses.length === 0`
- Category warning: AlertCircle shown when no categories selected (before the user runs the export)
- No error toast for failed exports — failures are silent beyond the button re-enabling

### Security Considerations

- Same CSV injection risk as v1 (leading formula characters in descriptions not sanitised)
- `exportPDF()` writes user-controlled data (`e.description`, `e.category`) into an HTML string via `window.open` + `document.write`. Since this is a same-origin tab opened by the app itself and the data comes from localStorage (user's own data), XSS isn't a realistic attack vector. However, if multi-user sharing is added, this would need to be revisited.
- No data leaves the browser.

### Performance Implications

- `useMemo` on `filteredExpenses` prevents re-filtering on every keypress (e.g., filename changes)
- The 600ms artificial delay in `runExport()` is UX-only — it simulates processing time to give the loading state visibility. For large datasets this is unnecessary latency.
- `exportPDF()` synchronously constructs a large HTML string; for thousands of records this could cause a brief jank before `window.open`.

### Extensibility and Maintainability

**High extensibility.** Adding a new format (e.g., XLSX) requires only a new `exportXLSX()` function in `exportUtils.ts` and a new `FORMAT_OPTIONS` entry in the modal — no architectural change.  
**Good maintainability.** The lib/component split means UI changes don't touch business logic. Types (`ExportFormat`, `ExportFilters`, `ExportConfig`) are explicitly defined and imported — no implicit shape assumptions.  
The only maintainability concern: the modal currently receives `expenses` directly, but filtering happens *inside* the modal. If filters need to be shared with other features (e.g., a "Export visible expenses" button in a filtered list), the state would need to be lifted or a context added.

---

## Version 3 — Cloud-Integrated Export System

### Files Created / Modified

| File | Change | Type |
|---|---|---|
| `src/lib/cloudExport.ts` | Created | New library (~350 lines) |
| `src/components/CloudExportPanel.tsx` | Created | New component (~480 lines) |
| `src/app/page.tsx` | Modified | Added panel state + button + mount |

Note: v3 was branched from clean `main`, not from v2. It does not include v2's `ExportModal` or `exportUtils.ts`.

### Code Architecture Overview

V3 adopts a "product feature" architecture rather than a utility function. The panel is a fixed slide-over (right-aligned, full-height overlay) containing four independently functional tabs, each backed by persistent localStorage state.

```
src/app/page.tsx
    └── <CloudExportPanel expenses onClose />
            ├── Tab: Export
            │     └── runExportWithHistory() ──→ simulated progress + CSV/JSON download
            │                                 ──→ saveHistory()
            ├── Tab: Schedule
            │     └── createSchedule()       ──→ saveSchedules()
            ├── Tab: History
            │     └── loadHistory()
            └── Tab: Share
                  └── createSharedLink()     ──→ saveSharedLinks()
                  └── generateQRGrid()       ──→ QRCodeGrid component
```

**`src/lib/cloudExport.ts`**

| Category | Exports |
|---|---|
| Constants | `DESTINATIONS: Destination[]`, `TEMPLATES: ExportTemplate[]` |
| Types | `DestinationId`, `ExportFormat`, `Frequency`, `TemplateId`, `Destination`, `ExportTemplate`, `ScheduledExport`, `ExportHistoryItem`, `SharedLink` |
| Persistence | `loadHistory/saveHistory`, `loadSchedules/saveSchedules`, `loadSharedLinks/saveSharedLinks`, `loadConnections/saveConnections` |
| Export orchestration | `runExportWithHistory()` |
| Link generation | `createSharedLink()` |
| Schedule creation | `createSchedule()` |
| QR generation | `generateQRGrid()` |

### Key Components and Responsibilities

**`DESTINATIONS`** — 6 destination objects:

```ts
interface Destination {
  id: DestinationId;       // "email" | "google_sheets" | "dropbox" | ...
  name: string;
  icon: string;            // emoji
  description: string;
  comingSoon?: boolean;    // disables the tile if true
}
```

Email is the only truly functional destination (triggers real download). The other five (Google Sheets, Dropbox, OneDrive, Notion, Airtable) are UI tiles with connect/disconnect toggle state saved to localStorage. They will show "Connect {name} First" on the export button if not "connected".

**`TEMPLATES`** — 5 export templates:

```ts
interface ExportTemplate {
  id: TemplateId;
  name: string;
  icon: string;
  description: string;
  defaultFormat: "csv" | "json" | "pdf";
  fields: string[];        // metadata — which fields to include
  dateRange?: "month" | "year" | "all";
}
```

Templates are UI presets that communicate intent (e.g., "Tax Report" implies annual + all categories). In the current implementation `fields` and `dateRange` are stored on the type but not yet used to actually filter data — `runExportWithHistory` exports all expenses regardless of the chosen template. This is an **incomplete feature** — the field is present for design documentation purposes.

**`runExportWithHistory()`** — the main export orchestrator:

```ts
async function runExportWithHistory(
  expenses: Expense[],
  template: ExportTemplate,
  destination: Destination,
  format: "csv" | "json" | "pdf",
  onProgress: (pct: number) => void
): Promise<void>
```

Simulates a 4-step progress sequence (25% → 50% → 75% → 100%) with 400ms delays between steps. After completion it generates an `ExportHistoryItem` and persists it to localStorage via `saveHistory()`. For email and JSON targets it triggers a real in-browser download via the same blob/anchor pattern used in v1/v2.

**`createSharedLink()`** — generates a cosmetic shared link:

```ts
function createSharedLink(label: string): SharedLink
```

Produces a `SharedLink` object with:
- A random hex `id` built from `Math.random()` 
- A fake URL: `https://spendwise.app/share/{id}`
- `expiresAt`: 7 days from now (ISO string)
- `views: 0`
- `active: true`

No real URL is created — this is entirely cosmetic, designed to demonstrate a full sharing UX without a backend.

**`generateQRGrid(seed: string): boolean[][]`** — deterministic 21×21 boolean grid:

```ts
function generateQRGrid(seed: string): boolean[][]
```

Produces a cosmetic QR-like grid using a seeded numeric hash of the input string. The grid is deterministic (same seed → same pattern) and visually QR-like (with corner "finder patterns" forced on), but it is **not a real QR code** and cannot be scanned. Rendered in `CloudExportPanel.tsx` as an 8×8px-per-cell CSS grid.

**`src/components/CloudExportPanel.tsx`** (~480 lines)

A right-aligned, full-height slide-over panel with:
- **Gradient header** (indigo-600 → violet-700) with app branding
- **Expense count pill** below header
- **Tab bar** with 4 tabs: Export, Schedule, History, Share
- **Escape key + backdrop click** to close

Each tab is a separate sub-component rendered conditionally:

| Sub-component | State variables | Key interactions |
|---|---|---|
| `ExportTab` | template, destination, format, progress, running, done, connections | Template/dest/format selection; run export with progress animation |
| `ScheduleTab` | schedules, templateId, destId, frequency, creating, saved | Create schedule form; toggle/delete existing schedules |
| `HistoryTab` | history | Load and display; clear all |
| `ShareTab` | links, label, creating, copiedId, showQR | Create link; copy URL; toggle QR code; revoke link |
| `QRCodeGrid` | — (props only) | Renders `generateQRGrid(seed)` as inline CSS grid |

### Libraries and Dependencies Used

- `date-fns`: `format()`, `parseISO()`, `formatDistanceToNow()`, `addDays()` (in cloudExport.ts)
- `lucide-react`: 29 icons across panel + sub-components
- `clsx`: Used for conditional class merging throughout
- No new npm packages

### Implementation Patterns

- **Module-level persistence helpers**: All 8 localStorage functions (`load*/save*`) are simple JSON serialize/deserialize wrappers with typed defaults — no class, no singleton, no context
- **Simulated async with artificial progress**: `runExportWithHistory` chains `setProgress` calls with `setTimeout` promises to animate a progress bar. This is a UX demo pattern — it does not reflect actual processing time
- **Seed-based determinism for QR**: `generateQRGrid` turns a string into a numeric hash via `charCodeAt` summing, then uses a Linear Congruential Generator pattern to fill the grid — this keeps the QR visually stable for the same link across re-renders without storing the grid
- **Connection state in localStorage**: `loadConnections/saveConnections` persist a `Record<DestinationId, boolean>` — connect/disconnect toggling survives page reload
- **Sub-component tabs**: Each tab (`ExportTab`, `ScheduleTab`, etc.) is a local function component in the same file, not exported. This keeps the panel self-contained at the cost of a large single file

### Code Complexity Assessment

**`cloudExport.ts`**: Moderate-high. The type system is rich (9 exported types). `runExportWithHistory` mixes progress simulation with real download logic. `generateQRGrid` is algorithmically dense (~25 lines of bit manipulation) but isolated.

**`CloudExportPanel.tsx`**: High complexity as a single file (~480 lines, 5 sub-components, ~20 total state variables across all tabs). However, the tab-based structure prevents any single component from holding too much state. The main `CloudExportPanel` component itself is thin — it only manages tab state and the keyboard handler.

### Error Handling

- **`window.open` null guard** in `runExportWithHistory`
- **Disabled export button** when a non-email destination is selected but not "connected"
- **`navigator.clipboard.writeText` has `.catch(() => {})` swallow** — copy failures are silently ignored (acceptable for cosmetic clipboard on unsupported browsers)
- No error handling for localStorage failures (e.g., quota exceeded — same as v1/v2)
- No error toast for failed exports

### Security Considerations

- Same CSV injection risk as v1/v2
- `createSharedLink()` generates fake URLs with `Math.random()` — not cryptographically secure. If real sharing were implemented this would need `crypto.getRandomValues()`.
- Connection state stored in localStorage as plain booleans — no OAuth tokens or real credentials persist (all integrations are simulated)
- `generateQRGrid` content is deterministic from a `Math.random()`-derived ID — two IDs could theoretically collide, producing identical QR grids. Non-issue for cosmetic purposes.

### Performance Implications

- `generateQRGrid` is called on every render of `QRCodeGrid`. Since it's O(n²) where n=21 (441 operations on a fixed-size grid), this is imperceptible.
- 4-step progress simulation adds 1.6s minimum to every export — this is intentional UX delay, not bottleneck.
- `loadHistory/loadSchedules/loadSharedLinks` are called in `useEffect` on tab mount — three separate localStorage reads each time the panel opens. A single load on panel mount with shared state would be more efficient.
- The slide-over renders all 5 `QRCodeGrid` cells' parent links simultaneously; QR grids are only rendered per `showQR === link.id` so cost is bounded to one grid at a time.

### Incomplete / Simulated Features

| Feature | Status |
|---|---|
| Template-based field/date filtering | **Not implemented** — all expenses exported regardless of template |
| Google Sheets / Dropbox / OneDrive / Notion / Airtable | **Simulated** — connect/disconnect toggled in localStorage, no real OAuth |
| Scheduled export execution | **Not implemented** — schedules are created and stored but never triggered |
| Shared link URL | **Cosmetic** — `spendwise.app/share/...` is a fake URL |
| QR code scanning | **Not functional** — cosmetic grid only |
| Email "Send" button | **Simulated** — no email is sent |

### Extensibility and Maintainability

**High extensibility potential.** The `Destination` and `ExportTemplate` type shapes are designed to be extended — adding a real OAuth destination would require adding an entry to `DESTINATIONS` and implementing the actual sync logic in `runExportWithHistory`.

**Medium maintainability concern.** The single 480-line component file with 5 sub-components will become hard to navigate as features mature. The natural next step would be splitting tabs into `components/cloud-export/ExportTab.tsx`, etc.

The incomplete features (template filtering, schedule execution) are technical debt that must be addressed before this could be shipped as real functionality.

---

## Cross-Version Comparison

### Architecture Philosophy

| | V1 | V2 | V3 |
|---|---|---|---|
| Philosophy | "Just make it work" | "Make it right" | "Make it impressive" |
| UI surface | Inline button | Centered modal | Full slide-over panel |
| State added | 0 variables | 8 variables (modal-local) | ~20 variables (across tabs) |
| Abstraction level | None (reuses existing fn) | Lib + component separation | Full feature module |
| Audience fit | Power user / developer | General user | Product demo / stakeholder |

### Export Function Comparison

| Aspect | V1 `exportToCSV` | V2 `exportCSV` | V3 `runExportWithHistory` |
|---|---|---|---|
| Sync/Async | Sync | Sync (wrapped in async orchestrator) | Async (progress simulation) |
| Formats | CSV | CSV, JSON, PDF | CSV, JSON |
| Filtering | None | Date + category (pre-export) | None (template presets stub) |
| Filename control | Auto (date-based) | User-controlled | Auto (template + date) |
| ID column | No | Yes | Yes |
| Date formatting | Raw ISO | `date-fns` format | `date-fns` format |
| Memory cleanup | `URL.revokeObjectURL` | `URL.revokeObjectURL` | `URL.revokeObjectURL` |
| Anchor safety | Detached (no append) | Proper append/remove | Proper append/remove |
| History logging | No | No | Yes (localStorage) |

### Where Each Version Excels

**V1 excels at:**
- Zero onboarding friction — one click, done
- Zero risk of regression — touches only one file
- Zero dependency footprint
- Instant comprehension for new engineers

**V2 excels at:**
- Real user control (which data to export, in what format)
- Live preview before committing to export
- PDF output (the only version with genuine PDF format via print dialog)
- Clean lib/component separation
- Production-ready error handling patterns
- Fully functional features — nothing is simulated

**V3 excels at:**
- Feature richness and product vision communication
- Persistence (history, schedules, connections survive reload)
- Shareability UI (even if cosmetic)
- Design quality (gradient header, animations, branded feel)
- Extensibility toward real cloud integrations

### What Each Version Is Missing

**V1 gaps:**
- No format choice
- No filtering
- No user feedback (no loading state, no success confirmation)
- No filename control
- No error handling

**V2 gaps:**
- No export history
- No repeat/schedule capability
- No sharing
- Only available from two fixed trigger points (no API)
- Artificial 600ms delay serves no purpose for small datasets

**V3 gaps:**
- Template filtering not wired up (fields/dateRange on `ExportTemplate` unused)
- No real PDF output
- All cloud destinations are simulated
- Schedules are stored but never executed
- Shared links point to non-existent URLs
- No data filtering before export (exports all records regardless of template)

---

## Combination Recommendation

A production implementation should combine the strengths of all three versions:

### Recommended Architecture

```
src/lib/
  exportUtils.ts         ← from V2 (base export functions: CSV/JSON/PDF)
  cloudExport.ts         ← from V3 (destinations, scheduling, history, sharing)

src/components/
  ExportModal.tsx        ← from V2 (format/filter/preview UI)
  CloudExportPanel.tsx   ← from V3, but refactored to:
                            - wire template.dateRange into filter logic
                            - use exportUtils.ts functions internally
                            - trigger real schedule execution via setInterval
  cloud-export/
    ExportTab.tsx        ← split from CloudExportPanel
    ScheduleTab.tsx
    HistoryTab.tsx
    ShareTab.tsx

src/app/
  page.tsx               ← "Cloud Export" button (V3 style) → opens CloudExportPanel
  expenses/page.tsx      ← "Export" button (V2 style) → opens ExportModal
                            (keeps per-page contextual filtering)
```

### Specific Merges

| V2 feature | V3 addition | Result |
|---|---|---|
| `applyExportFilters()` | Template `dateRange` + `fields` | Templates auto-populate the filter form |
| `exportPDF()` | V3 format selector | PDF format re-enabled in V3 panel |
| `ExportConfig` type | `ExportTemplate` | Config generated from template selection |
| `ExportModal` preview | V3 history tab | Show preview before export, history after |
| V2 clean anchor handling | V3 progress simulation | Real progress (if generating large files) over proper cleanup |

### Priority Order for Productionisation

1. **Ship V2** — it is the only version with fully functional, non-simulated features appropriate for users.
2. **Wire V3 template filters** — connect `template.dateRange` and `template.fields` to actual `applyExportFilters()` calls.
3. **Add real PDF to V3** — import `exportPDF()` from `exportUtils.ts` into `runExportWithHistory`.
4. **Implement real schedule execution** — a `useEffect` on app mount that checks `loadSchedules()`, compares `nextRun` to `Date.now()`, and fires overdue exports.
5. **Add OAuth for one real destination** — Google Sheets via Sheets API is the highest-value first integration.
6. **Split `CloudExportPanel.tsx`** into per-tab files once it exceeds 600 lines.
