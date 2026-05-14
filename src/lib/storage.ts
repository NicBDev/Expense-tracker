import { type Expense } from "@/types";

const STORAGE_KEY = "expense-tracker-data";

export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Expense): Expense[] {
  const existing = loadExpenses();
  const updated = [expense, ...existing];
  saveExpenses(updated);
  return updated;
}

export function updateExpense(expense: Expense): Expense[] {
  const existing = loadExpenses();
  const updated = existing.map((e) => (e.id === expense.id ? expense : e));
  saveExpenses(updated);
  return updated;
}

export function deleteExpense(id: string): Expense[] {
  const existing = loadExpenses();
  const updated = existing.filter((e) => e.id !== id);
  saveExpenses(updated);
  return updated;
}
