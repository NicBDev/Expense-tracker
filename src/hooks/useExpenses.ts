"use client";

import { useState, useEffect, useCallback } from "react";
import { type Expense, type FilterState, type SortField, type SortOrder } from "@/types";
import {
  loadExpenses,
  saveExpenses,
  addExpense as storageAdd,
  updateExpense as storageUpdate,
  deleteExpense as storageDelete,
} from "@/lib/storage";
import { parseISO } from "date-fns";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExpenses(loadExpenses());
    setHydrated(true);
  }, []);

  const add = useCallback((expense: Expense) => {
    setExpenses(storageAdd(expense));
  }, []);

  const update = useCallback((expense: Expense) => {
    setExpenses(storageUpdate(expense));
  }, []);

  const remove = useCallback((id: string) => {
    setExpenses(storageDelete(id));
  }, []);

  return { expenses, hydrated, add, update, remove };
}

export function useFilteredExpenses(
  expenses: Expense[],
  filter: FilterState,
  sortField: SortField,
  sortOrder: SortOrder
) {
  const filtered = expenses.filter((e) => {
    if (filter.category !== "All" && e.category !== filter.category)
      return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !e.description.toLowerCase().includes(q) &&
        !e.category.toLowerCase().includes(q) &&
        !e.amount.toString().includes(q)
      )
        return false;
    }
    if (filter.dateFrom && e.date < filter.dateFrom) return false;
    if (filter.dateTo && e.date > filter.dateTo) return false;
    return true;
  });

  filtered.sort((a, b) => {
    let diff = 0;
    if (sortField === "date") diff = a.date.localeCompare(b.date);
    else if (sortField === "amount") diff = a.amount - b.amount;
    else if (sortField === "category") diff = a.category.localeCompare(b.category);
    else if (sortField === "description") diff = a.description.localeCompare(b.description);
    return sortOrder === "asc" ? diff : -diff;
  });

  return filtered;
}
