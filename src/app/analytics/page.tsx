"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { computeStats } from "@/lib/utils";
import TrendChart from "@/components/TrendChart";
import MonthComparisonChart from "@/components/MonthComparisonChart";
import WeekdayChart from "@/components/WeekdayChart";
import InsightsPanel from "@/components/InsightsPanel";
import CategoryChart from "@/components/CategoryChart";
import { BarChart2 } from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function AnalyticsPage() {
  const { expenses, hydrated } = useExpenses();
  const stats = useMemo(() => computeStats(expenses), [expenses]);
  const [trendDays, setTrendDays] = useState(30);

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
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Deep insights into your spending patterns
          </p>
        </div>

        {/* Trend period picker */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTrendDays(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                trendDays === opt.value
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trend + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendChart expenses={expenses} days={trendDays} />
        </div>
        <InsightsPanel expenses={expenses} />
      </div>

      {/* Month comparison + Category pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthComparisonChart expenses={expenses} />
        <CategoryChart stats={stats} />
      </div>

      {/* Weekday heatmap */}
      <WeekdayChart expenses={expenses} />

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No data to analyse yet
          </h3>
          <p className="text-slate-500 text-sm">
            Add expenses on the Dashboard to start seeing trends and insights here.
          </p>
        </div>
      )}
    </div>
  );
}
