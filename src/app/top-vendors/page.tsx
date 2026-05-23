"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { Store } from "lucide-react";
import { subDays, parseISO, isAfter } from "date-fns";

const PERIOD_OPTIONS = [
  { label: "All Time", value: 0 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

const TOP_N_OPTIONS = [
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "All", value: 0 },
];

/** Returns the most-frequent value in an array of strings. */
function mostFrequent(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = "";
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export default function TopVendorsPage() {
  const { expenses, hydrated } = useExpenses();
  const [period, setPeriod] = useState(0);
  const [topN, setTopN] = useState(10);

  const filteredExpenses = useMemo(() => {
    if (period === 0) return expenses;
    const cutoff = subDays(new Date(), period);
    return expenses.filter((e) => isAfter(parseISO(e.date), cutoff));
  }, [expenses, period]);

  const { vendors, totalSpend } = useMemo(() => {
    const map = new Map<
      string,
      { total: number; count: number; categories: string[] }
    >();
    for (const e of filteredExpenses) {
      const existing = map.get(e.description) ?? {
        total: 0,
        count: 0,
        categories: [],
      };
      map.set(e.description, {
        total: existing.total + e.amount,
        count: existing.count + 1,
        categories: [...existing.categories, e.category],
      });
    }
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const sorted = Array.from(map.entries())
      .map(([name, { total: vTotal, count, categories }]) => ({
        name,
        total: vTotal,
        count,
        topCategory: mostFrequent(categories),
        pct: total > 0 ? (vTotal / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
    return { vendors: sorted, totalSpend: total };
  }, [filteredExpenses]);

  const displayedVendors = topN === 0 ? vendors : vendors.slice(0, topN);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Top Vendors</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Your spending ranked by vendor
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Top-N picker */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {TOP_N_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTopN(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  topN === opt.value
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Period picker */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === opt.value
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {vendors.length > 0 && (
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
              Unique Vendors
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {vendors.length}
            </p>
          </div>
        </div>
      )}

      {/* Ranked list */}
      {displayedVendors.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {displayedVendors.map((vendor, i) => (
              <div key={vendor.name} className="px-6 py-4">
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? "bg-emerald-600 text-white"
                        : i === 1
                        ? "bg-emerald-200 text-emerald-800"
                        : i === 2
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-900 truncate">
                          {vendor.name}
                        </span>
                        {vendor.topCategory && (
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                            {vendor.topCategory}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400">
                          {vendor.count} {vendor.count === 1 ? "tx" : "txs"}
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums w-12 text-right">
                          {vendor.pct.toFixed(1)}%
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums w-24 text-right">
                          $
                          {vendor.total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    {/* Percentage bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${vendor.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {topN > 0 && vendors.length > topN && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Showing {topN} of {vendors.length} vendors
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No expenses yet
          </h3>
          <p className="text-slate-500 text-sm">
            Add expenses on the Dashboard to see your top vendors here.
          </p>
        </div>
      )}
    </div>
  );
}
