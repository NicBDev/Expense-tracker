"use client";

import { useState, useEffect, useCallback } from "react";
import { type Expense, type FilterState, type SortField, type SortOrder } from "@/types";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "next-auth/react";

// ─────────────────────────────────────────────────────────────────────────────
// API-backed expense hook
// ─────────────────────────────────────────────────────────────────────────────

export function useExpenses() {
  const { workspaceId } = useWorkspace();
  const { status } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!workspaceId || status !== "authenticated") return;
    setHydrated(false);
    try {
      const res = await fetch(`/api/expenses?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const data = await res.json();
      setExpenses(
        data.map((e: {
          id: string; date: string; amount: number; category: string;
          description: string; createdAt: string;
        }) => ({
          id: e.id,
          date: e.date,
          amount: e.amount,
          category: e.category,
          description: e.description,
          createdAt: e.createdAt,
        }))
      );
    } finally {
      setHydrated(true);
    }
  }, [workspaceId, status]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const add = useCallback(
    async (expense: Omit<Expense, "id" | "createdAt">) => {
      if (!workspaceId) return;
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expense, workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to create expense");
      const created = await res.json();
      setExpenses((prev) => [
        {
          id: created.id,
          date: created.date,
          amount: created.amount,
          category: created.category,
          description: created.description,
          createdAt: created.createdAt,
        },
        ...prev,
      ]);
    },
    [workspaceId]
  );

  const update = useCallback(async (expense: Expense) => {
    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
      }),
    });
    if (!res.ok) throw new Error("Failed to update expense");
    const updated = await res.json();
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expense.id
          ? { ...e, date: updated.date, amount: updated.amount, category: updated.category, description: updated.description }
          : e
      )
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete expense");
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { expenses, hydrated, add, update, remove, refresh: fetchExpenses };
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtering + sorting (pure, unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export function useFilteredExpenses(
  expenses: Expense[],
  filter: FilterState,
  sortField: SortField,
  sortOrder: SortOrder
) {
  const filtered = expenses.filter((e) => {
    if (filter.category !== "All" && e.category !== filter.category) return false;
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
