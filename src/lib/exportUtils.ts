import { type Expense, type Category } from "@/types";
import { format, parseISO } from "date-fns";
import { formatCurrency, CATEGORY_ICONS } from "@/lib/utils";

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportFilters {
  startDate: string;
  endDate: string;
  categories: Category[];
}

export interface ExportConfig {
  format: ExportFormat;
  filename: string;
  filters: ExportFilters;
}

/** Apply export-specific date + category filters to a raw expense list */
export function applyExportFilters(
  expenses: Expense[],
  filters: ExportFilters
): Expense[] {
  return expenses.filter((e) => {
    if (filters.startDate && e.date < filters.startDate) return false;
    if (filters.endDate && e.date > filters.endDate) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(e.category))
      return false;
    return true;
  });
}

/** Export as CSV */
export function exportCSV(expenses: Expense[], filename: string): void {
  const headers = ["Date", "Amount (USD)", "Category", "Description", "ID"];
  const rows = expenses.map((e) => [
    format(parseISO(e.date), "yyyy-MM-dd"),
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.id,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadBlob(csv, `${filename}.csv`, "text/csv");
}

/** Export as JSON */
export function exportJSON(expenses: Expense[], filename: string): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description,
      createdAt: e.createdAt,
    })),
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `${filename}.json`,
    "application/json"
  );
}

/** Export as a printable PDF via browser print dialog */
export function exportPDF(expenses: Expense[], filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const exportDate = format(new Date(), "MMMM d, yyyy 'at' h:mm a");

  // Group totals by category
  const byCat: Record<string, number> = {};
  expenses.forEach((e) => {
    byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
  });
  const catRows = Object.entries(byCat)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([cat, amt]) =>
        `<tr>
          <td style="padding:6px 12px">${CATEGORY_ICONS[cat as Category] ?? ""} ${cat}</td>
          <td style="padding:6px 12px;text-align:right">${formatCurrency(amt)}</td>
          <td style="padding:6px 12px;text-align:right;color:#6b7280">
            ${expenses.length > 0 ? ((amt / total) * 100).toFixed(1) : 0}%
          </td>
        </tr>`
    )
    .join("");

  const rowsHTML = expenses
    .map(
      (e) =>
        `<tr>
          <td style="padding:6px 12px">${format(parseISO(e.date), "MMM d, yyyy")}</td>
          <td style="padding:6px 12px">${CATEGORY_ICONS[e.category] ?? ""} ${e.category}</td>
          <td style="padding:6px 12px">${e.description}</td>
          <td style="padding:6px 12px;text-align:right;font-weight:500">${formatCurrency(e.amount)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; color: #4f46e5; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 28px; }
    h2 { font-size: 14px; font-weight: 600; color: #334155; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f1f5f9; }
    th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tfoot td { border-top: 2px solid #e2e8f0; padding: 8px 12px; font-weight: 700; }
    .summary-box { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat { background: #f1f5f9; border-radius: 8px; padding: 12px 16px; flex: 1; }
    .stat-label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
    .stat-value { font-size: 18px; font-weight: 700; color: #4f46e5; }
    @media print { @page { margin: 20mm; } }
  </style>
</head>
<body>
  <h1>💰 Expense Report</h1>
  <p class="meta">Generated ${exportDate} · ${filename}</p>

  <div class="summary-box">
    <div class="stat">
      <div class="stat-label">Total Records</div>
      <div class="stat-value">${expenses.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total Amount</div>
      <div class="stat-value">${formatCurrency(total)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Date Range</div>
      <div class="stat-value" style="font-size:13px">
        ${expenses.length > 0
          ? `${format(parseISO(expenses[expenses.length - 1].date), "MMM d")} – ${format(parseISO(expenses[0].date), "MMM d, yyyy")}`
          : "—"}
      </div>
    </div>
  </div>

  <h2>Category Summary</h2>
  <table>
    <thead><tr><th>Category</th><th style="text-align:right">Total</th><th style="text-align:right">% of Spend</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>

  <h2>All Transactions</h2>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rowsHTML}</tbody>
    <tfoot><tr><td colspan="3">Total</td><td style="text-align:right">${formatCurrency(total)}</td></tr></tfoot>
  </table>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}

/** Trigger a file download from a string blob */
function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Run the full export pipeline */
export async function runExport(
  expenses: Expense[],
  config: ExportConfig
): Promise<void> {
  // Simulate async processing for loading state UX
  await new Promise((r) => setTimeout(r, 600));
  const data = applyExportFilters(expenses, config.filters);
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));

  switch (config.format) {
    case "csv":
      exportCSV(sorted, config.filename);
      break;
    case "json":
      exportJSON(sorted, config.filename);
      break;
    case "pdf":
      exportPDF(sorted, config.filename);
      break;
  }
}
