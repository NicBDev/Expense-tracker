import { type Category, type Expense, type SummaryStats } from "@/types";
import { format, startOfMonth, startOfYear, isWithinInterval, parseISO } from "date-fns";

export const CATEGORIES: Category[] = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Travel",
  "Other",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#f97316",
  Transportation: "#3b82f6",
  Entertainment: "#8b5cf6",
  Shopping: "#ec4899",
  Bills: "#ef4444",
  Travel: "#10b981",
  Other: "#6b7280",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: "🍔",
  Transportation: "🚗",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Bills: "💡",
  Travel: "✈️",
  Other: "📦",
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function computeStats(expenses: Expense[]): SummaryStats {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const totalThisMonth = expenses
    .filter((e) => parseISO(e.date) >= monthStart)
    .reduce((s, e) => s + e.amount, 0);
  const totalThisYear = expenses
    .filter((e) => parseISO(e.date) >= yearStart)
    .reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      return acc;
    },
    {} as Record<Category, number>
  );

  // Last 6 months
  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = format(d, "MMM yyyy");
    monthlyMap[key] = 0;
  }
  expenses.forEach((e) => {
    const d = parseISO(e.date);
    const key = format(d, "MMM yyyy");
    if (key in monthlyMap) {
      monthlyMap[key] += e.amount;
    }
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, total]) => ({
    month,
    total,
  }));

  return { totalAll, totalThisMonth, totalThisYear, categoryTotals, monthlyData, count: expenses.length };
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ["Date", "Amount", "Category", "Description"];
  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
