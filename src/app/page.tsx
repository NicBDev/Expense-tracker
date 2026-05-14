"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { computeStats } from "@/lib/utils";
import SummaryCards from "@/components/SummaryCards";
import SpendingChart from "@/components/SpendingChart";
import CategoryChart from "@/components/CategoryChart";
import Link from "next/link";
import { ArrowRight, PlusCircle, Download } from "lucide-react";
import { formatCurrency, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/utils";
import { type Category } from "@/types";
import ExportModal from "@/components/ExportModal";

export default function DashboardPage() {
  const { expenses, hydrated } = useExpenses();
  const stats = useMemo(() => computeStats(expenses), [expenses]);
  const [showExportModal, setShowExportModal] = useState(false);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Your spending at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          <Link
            href="/expenses?add=true"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingChart stats={stats} />
        <CategoryChart stats={stats} />
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Category Breakdown
        </h3>
        <div className="space-y-3">
          {(Object.entries(stats.categoryTotals) as [Category, number][])
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, total]) => {
              const pct = stats.totalAll > 0 ? (total / stats.totalAll) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      {CATEGORY_ICONS[cat]} {cat}
                    </span>
                    <span className="text-slate-600">
                      {formatCurrency(total)}{" "}
                      <span className="text-slate-400 text-xs">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CATEGORY_COLORS[cat],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          {Object.values(stats.categoryTotals).every((v) => v === 0) && (
            <p className="text-slate-400 text-sm text-center py-4">
              No spending data yet.
            </p>
          )}
        </div>
      </div>

      {/* Recent expenses */}
      {recentExpenses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Recent Expenses
            </h3>
            <Link
              href="/expenses"
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentExpenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{
                    backgroundColor: CATEGORY_COLORS[e.category as Category] + "20",
                  }}
                >
                  {CATEGORY_ICONS[e.category as Category]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {e.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(e.date)} · {e.category}
                  </p>
                </div>
                <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">
                  {formatCurrency(e.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          expenses={expenses}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Welcome to SpendWise!
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Start tracking your expenses to see insights and analytics here.
          </p>
          <Link
            href="/expenses?add=true"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Your First Expense
          </Link>
        </div>
      )}
    </div>
  );
}
