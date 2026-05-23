import { type Expense, type Category } from "@/types";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { formatCurrency, CATEGORY_ICONS } from "@/lib/utils";

// ─── Destination Types ───────────────────────────────────────────────────────

export type DestinationId =
  | "email"
  | "google_sheets"
  | "dropbox"
  | "onedrive"
  | "notion"
  | "airtable";

export interface Destination {
  id: DestinationId;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  description: string;
  comingSoon?: boolean;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "email",
    name: "Email",
    icon: "✉️",
    color: "#6366f1",
    connected: true,
    description: "Send directly to your inbox",
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    icon: "📊",
    color: "#0f9d58",
    connected: false,
    description: "Sync to a live spreadsheet",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "📦",
    color: "#0061ff",
    connected: false,
    description: "Save to your Dropbox",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    icon: "☁️",
    color: "#0078d4",
    connected: false,
    description: "Store in Microsoft OneDrive",
  },
  {
    id: "notion",
    name: "Notion",
    icon: "📝",
    color: "#000000",
    connected: false,
    description: "Push to a Notion database",
    comingSoon: true,
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: "🗂️",
    color: "#fcb400",
    connected: false,
    description: "Sync to Airtable base",
    comingSoon: true,
  },
];

// ─── Export Templates ────────────────────────────────────────────────────────

export type TemplateId =
  | "tax_report"
  | "monthly_summary"
  | "category_analysis"
  | "annual_overview"
  | "custom";

export interface ExportTemplate {
  id: TemplateId;
  name: string;
  icon: string;
  description: string;
  columns: string[];
  defaultFormat: "csv" | "json" | "pdf";
  filterPreset?: { months?: number; categories?: Category[] };
}

export const TEMPLATES: ExportTemplate[] = [
  {
    id: "tax_report",
    name: "Tax Report",
    icon: "🧾",
    description: "Formatted for tax filing — all deductible categories, yearly totals",
    columns: ["Date", "Category", "Amount", "Description", "ID"],
    defaultFormat: "pdf",
    filterPreset: { months: 12 },
  },
  {
    id: "monthly_summary",
    name: "Monthly Summary",
    icon: "📅",
    description: "This month's expenses grouped by category with running totals",
    columns: ["Date", "Category", "Amount", "Description"],
    defaultFormat: "csv",
    filterPreset: { months: 1 },
  },
  {
    id: "category_analysis",
    name: "Category Analysis",
    icon: "📈",
    description: "Breakdown by category with percentages and averages",
    columns: ["Category", "Total", "Count", "Average", "% of Spending"],
    defaultFormat: "csv",
  },
  {
    id: "annual_overview",
    name: "Annual Overview",
    icon: "📆",
    description: "Month-by-month totals for the current year",
    columns: ["Month", "Total", "Top Category", "Largest Expense"],
    defaultFormat: "pdf",
    filterPreset: { months: 12 },
  },
  {
    id: "custom",
    name: "Custom",
    icon: "⚙️",
    description: "Define your own columns, date range, and format",
    columns: [],
    defaultFormat: "csv",
  },
];

// ─── Schedule Types ───────────────────────────────────────────────────────────

export type Frequency = "daily" | "weekly" | "monthly" | "quarterly";

export interface ScheduledExport {
  id: string;
  templateId: TemplateId;
  destinationId: DestinationId;
  frequency: Frequency;
  nextRun: string; // ISO
  active: boolean;
  createdAt: string;
}

// ─── Export History ───────────────────────────────────────────────────────────

export type ExportStatus = "success" | "failed" | "pending";

export interface ExportHistoryItem {
  id: string;
  templateName: string;
  destinationName: string;
  destinationIcon: string;
  format: string;
  recordCount: number;
  fileSize: string;
  timestamp: string;
  status: ExportStatus;
  downloadUrl?: string;
}

// ─── Shared Link ──────────────────────────────────────────────────────────────

export interface SharedLink {
  id: string;
  label: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  views: number;
  active: boolean;
}

// ─── localStorage keys ────────────────────────────────────────────────────────

const HISTORY_KEY = "spendwise-export-history";
const SCHEDULES_KEY = "spendwise-schedules";
const LINKS_KEY = "spendwise-shared-links";
const CONNECTIONS_KEY = "spendwise-connections";

// ─── Persistence ──────────────────────────────────────────────────────────────

export function loadHistory(): ExportHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

export function saveHistory(items: ExportHistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function loadSchedules(): ScheduledExport[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SCHEDULES_KEY) || "[]");
  } catch { return []; }
}

export function saveSchedules(items: ScheduledExport[]): void {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(items));
}

export function loadSharedLinks(): SharedLink[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LINKS_KEY) || "[]");
  } catch { return []; }
}

export function saveSharedLinks(items: SharedLink[]): void {
  localStorage.setItem(LINKS_KEY, JSON.stringify(items));
}

export function loadConnections(): Record<DestinationId, boolean> {
  if (typeof window === "undefined") return {} as Record<DestinationId, boolean>;
  try {
    return JSON.parse(localStorage.getItem(CONNECTIONS_KEY) || "{}");
  } catch { return {} as Record<DestinationId, boolean>; }
}

export function saveConnections(c: Record<DestinationId, boolean>): void {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(c));
}

// ─── Generation helpers ───────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextRunDate(freq: Frequency): string {
  const d = new Date();
  if (freq === "daily") d.setDate(d.getDate() + 1);
  else if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setMonth(d.getMonth() + 3);
  return d.toISOString();
}

/** Simulate running an export — adds an entry to history & triggers download */
export function runExportWithHistory(
  expenses: Expense[],
  template: ExportTemplate,
  destination: Destination,
  format: "csv" | "json" | "pdf",
  onProgress: (pct: number) => void
): Promise<ExportHistoryItem> {
  return new Promise((resolve) => {
    const steps = [20, 50, 80, 100];
    let i = 0;
    const tick = setInterval(() => {
      onProgress(steps[i]);
      i++;
      if (i >= steps.length) {
        clearInterval(tick);

        // Apply filter preset
        let filtered = expenses;
        if (template.filterPreset?.months) {
          const cutoff = subMonths(new Date(), template.filterPreset.months);
          filtered = expenses.filter((e) => parseISO(e.date) >= cutoff);
        }

        // Do the actual file download if format is something we can produce
        if (destination.id === "email" || !destination.connected) {
          if (format === "csv") downloadCSV(filtered, template.name);
          else if (format === "json") downloadJSON(filtered, template.name);
        }

        const item: ExportHistoryItem = {
          id: uid(),
          templateName: template.name,
          destinationName: destination.name,
          destinationIcon: destination.icon,
          format: format.toUpperCase(),
          recordCount: filtered.length,
          fileSize: `${(filtered.length * 0.4 + 1.2).toFixed(1)} KB`,
          timestamp: new Date().toISOString(),
          status: "success",
        };

        const history = loadHistory();
        saveHistory([item, ...history].slice(0, 50));
        resolve(item);
      }
    }, 350);
  });
}

function downloadCSV(expenses: Expense[], label: string): void {
  const headers = ["Date", "Category", "Amount (USD)", "Description"];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    e.amount.toFixed(2),
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  triggerDownload(
    new Blob([csv], { type: "text/csv" }),
    `spendwise-${label.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
}

function downloadJSON(expenses: Expense[], label: string): void {
  const json = JSON.stringify(expenses, null, 2);
  triggerDownload(
    new Blob([json], { type: "application/json" }),
    `spendwise-${label.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.json`
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Create a new shared link (simulated URL) */
export function createSharedLink(label: string): SharedLink {
  const id = uid();
  const link: SharedLink = {
    id,
    label,
    url: `https://spendwise.app/share/${id}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    views: 0,
    active: true,
  };
  const links = loadSharedLinks();
  saveSharedLinks([link, ...links]);
  return link;
}

/** Create or update a scheduled export */
export function createSchedule(
  templateId: TemplateId,
  destinationId: DestinationId,
  frequency: Frequency
): ScheduledExport {
  const schedule: ScheduledExport = {
    id: uid(),
    templateId,
    destinationId,
    frequency,
    nextRun: nextRunDate(frequency),
    active: true,
    createdAt: new Date().toISOString(),
  };
  const schedules = loadSchedules();
  saveSchedules([schedule, ...schedules]);
  return schedule;
}

/** Generate a simple SVG QR-code-like grid (cosmetic, encodes nothing) */
export function generateQRGrid(seed: string): boolean[][] {
  // deterministic-ish pattern from the seed string
  const size = 21;
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      const val = seed.charCodeAt((r * size + c) % seed.length);
      grid[r][c] = ((val * (r + 1) * (c + 1)) % 3) !== 0;
    }
  }
  // add finder patterns (corners)
  const fp = (sr: number, sc: number) => {
    for (let dr = 0; dr < 7; dr++)
      for (let dc = 0; dc < 7; dc++)
        grid[sr + dr][sc + dc] =
          dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
          (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
  };
  fp(0, 0); fp(0, 14); fp(14, 0);
  return grid;
}
