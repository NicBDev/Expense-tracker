"use client";

import { useExpenses } from "@/hooks/useExpenses";
import MonthlyInsights from "@/components/MonthlyInsights";

export default function MonthlyInsightsPage() {
  const { expenses, hydrated } = useExpenses();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Monthly Insights</h1>
        <p className="text-slate-500 text-sm mt-1">Your spending snapshot for this month</p>
      </div>
      <MonthlyInsights expenses={expenses} />
    </div>
  );
}
