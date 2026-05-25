"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { type Expense, type Category } from "@/types";
import { CATEGORY_COLORS, CATEGORY_ICONS, formatCurrency } from "@/lib/utils";
import { parseISO, format, subDays, startOfMonth } from "date-fns";
import { Flame } from "lucide-react";

interface Props {
  expenses: Expense[];
}

function computeMonthlyInsights(expenses: Expense[]) {
  const now = new Date();
  const monthStart = startOfMonth(now);

  // This month's expenses only
  const thisMonth = expenses.filter((e) => parseISO(e.date) >= monthStart);

  // Category totals
  const catTotals: Partial<Record<Category, number>> = {};
  thisMonth.forEach((e) => {
    catTotals[e.category as Category] = (catTotals[e.category as Category] ?? 0) + e.amount;
  });

  // Top 3 categories
  const top3 = (Object.entries(catTotals) as [Category, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Donut data — all categories with spend
  const donutData = (Object.entries(catTotals) as [Category, number][])
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Budget streak — consecutive days (going back from today) where
  // daily spend is ≤ monthly daily average
  const daysElapsed = Math.max(1, now.getDate());
  const monthlyTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const dailyAvg = monthlyTotal / daysElapsed;

  // Build daily spend map for last 30 days
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(now, i), "yyyy-MM-dd");
    dailyMap[d] = 0;
  }
  expenses.forEach((e) => {
    if (e.date in dailyMap) dailyMap[e.date] += e.amount;
  });

  // Count streak from today backwards
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(now, i), "yyyy-MM-dd");
    if ((dailyMap[d] ?? 0) <= dailyAvg) {
      streak++;
    } else {
      break;
    }
  }

  return { top3, donutData, streak, monthlyTotal };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-slate-700">{payload[0].name}</p>
      <p className="text-slate-500">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const DonutLabel = ({ total }: { total: number }) => (
  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
    <tspan x="50%" dy="-0.4em" fontSize="11" fill="#94a3b8">Spending</tspan>
    <tspan x="50%" dy="1.4em" fontSize="14" fontWeight="600" fill="#1e293b">
      {formatCurrency(total)}
    </tspan>
  </text>
);

export default function MonthlyInsights({ expenses }: Props) {
  const { top3, donutData, streak, monthlyTotal } = useMemo(
    () => computeMonthlyInsights(expenses),
    [expenses]
  );
  const [streakEnabled, setStreakEnabled] = useState(true);

  const hasData = donutData.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm mx-auto space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Georgia, serif" }}>
          Monthly Insights
        </h2>
        <div className="flex justify-center mt-1">
          <svg width="180" height="6" viewBox="0 0 180 6">
            <path
              d="M2,3 C20,1 40,5 60,3 C80,1 100,5 120,3 C140,1 160,5 178,3"
              stroke="#94a3b8"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 3"
            />
          </svg>
        </div>
      </div>

      {/* Donut chart */}
      {hasData ? (
        <div className="flex justify-center">
          <div className="relative w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutData.map(({ name }) => (
                    <Cell key={name} fill={CATEGORY_COLORS[name as Category]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400">Spending</span>
              <span className="text-sm font-bold text-slate-800">{formatCurrency(monthlyTotal)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-44 text-slate-400 text-sm">
          No spending this month yet
        </div>
      )}

      {/* Top 3 categories */}
      <div className="space-y-3">
        {top3.length > 0 && (
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top {top3.length}</p>
        )}
        {top3.map(([cat, total], i) => (
          <div key={cat} className="flex items-center gap-3">
            {/* Color bar */}
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            />
            {/* Icon + name + amount */}
            <span className="text-xl shrink-0">{CATEGORY_ICONS[cat]}</span>
            <span className="flex-1 text-sm font-medium text-slate-700">{cat}</span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(total)}</span>
          </div>
        ))}
        {top3.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-2">No data yet</p>
        )}
      </div>

      {/* Budget Streak */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-4"
        style={{ borderColor: streakEnabled ? "#86efac" : "#e2e8f0" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600">Budget Streak</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-4xl font-bold transition-colors"
                style={{ color: streakEnabled ? "#22c55e" : "#94a3b8" }}
              >
                {streak}
              </span>
              <span className="text-sm text-slate-500 font-medium">days!</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {streak > 0
                ? "Consecutive days at or under your daily avg"
                : "Spent over your daily avg today"}
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setStreakEnabled((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${
              streakEnabled ? "bg-green-400" : "bg-slate-200"
            }`}
            aria-label="Toggle budget streak"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                streakEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Flame icons for streak */}
        {streakEnabled && streak > 0 && (
          <div className="flex gap-0.5 mt-3 flex-wrap">
            {Array.from({ length: Math.min(streak, 14) }).map((_, i) => (
              <Flame
                key={i}
                className="w-4 h-4"
                style={{ color: i < streak ? "#f97316" : "#e2e8f0" }}
              />
            ))}
            {streak > 14 && (
              <span className="text-xs text-slate-400 self-center ml-1">+{streak - 14} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
