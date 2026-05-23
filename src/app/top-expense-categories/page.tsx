"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { Tag } from "lucide-react";
import { subDays, parseISO, isAfter } from "date-fns";

const PERIOD_OPTIONS = [
  { label: "All Time", value: 0 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

export default function TopExpenseCategoriesPage() {
  const { expenses, hydrated } = useExpenses();
  const [period, setPeriod] = useState(0);

  const filteredExpenses = useMemo(() => {
    if (period === 0) return expenses;
    const cutoff = subDays(new Date(), period);
    return expenses.filter((e) => isAfter(parseISO(e.date), cutoff));
  }, [expenses, period]);

  const { categories, totalSpend } = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of filteredExpenses) {
      const existing = map.get(e.category) ?? { total: 0, count: 0 };
      map.set(e.category, {
        total: existing.total + e.amount,
        count: existing.count + 1,
      });
    }
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const sorted = Array.from(map.entries())
      .map(([name, { total: catTotal, count }]) => ({
        name,
        total: catTotal,
        count,
        pct: total > 0 ? (catTotal / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
    return { categories: sorted, totalSpend: total };
  }, [filteredExpenses]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Top Expense Categories
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Your spending ranked by category
          </p>
        </div>

        {/* Period picker */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === opt.value
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Spend
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              $
              {totalSpend.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Categories
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {categories.length}
            </p>
          </div>
        </div>
      )}

      {/* Ranked list */}
      {categories.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {categories.map((cat, i) => (
              <div key={cat.name} className="px-6 py-4">
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? "bg-indigo-600 text-white"
                        : i === 1
                        ? "bg-indigo-200 text-indigo-800"
                        : i === 2
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 truncate">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-slate-400">
                          {cat.count} {cat.count === 1 ? "tx" : "txs"}
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums w-12 text-right">
                          {cat.pct.toFixed(1)}%
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums w-24 text-right">
                          $
                          {cat.total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    {/* Percentage bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-5xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No expenses yet
          </h3>
          <p className="text-slate-500 text-sm">
            Add expenses on the Dashboard to see your top categories here.
          </p>
        </div>
      )}
    </div>
  );
}
