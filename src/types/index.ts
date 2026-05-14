export type Category =
  | "Food"
  | "Transportation"
  | "Entertainment"
  | "Shopping"
  | "Bills"
  | "Travel"
  | "Other";

export interface Expense {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  category: Category;
  description: string;
  createdAt: string;
}

export type SortField = "date" | "amount" | "category" | "description";
export type SortOrder = "asc" | "desc";

export interface FilterState {
  search: string;
  category: Category | "All";
  dateFrom: string;
  dateTo: string;
}

export interface SummaryStats {
  totalAll: number;
  totalThisMonth: number;
  totalThisYear: number;
  categoryTotals: Record<Category, number>;
  monthlyData: { month: string; total: number }[];
  count: number;
}
