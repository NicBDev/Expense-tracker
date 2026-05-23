"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Star,
  Zap,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import { type Expense, type Category } from "@/types";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/utils";
import {
  parseISO,
  startOfMonth,
  subMonths,
  differenceInCalendarDays,
  format,
  getDay,
} from "date-fns";

interface Props {
  expenses: Expense[];
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function computeInsights(expenses: Expense[]) {
  if (expenses.length === 0) return [];

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));

  const thisMonth = expenses.filter((e) => parseISO(e.date) >= thisMonthStart);
  const lastMonth = expenses.filter(
    (e) => parseISO(e.date) >= lastMonthStart && parseISO(e.date) < thisMonthStart
  );

  const thisTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const lastTotal = lastMonth.reduce((s, e) => s + e.amount, 0);

  const insights: {
    icon: React.ElementType;
    color: string;
    bg: string;
    title: string;
    body: string;
  }[] = [];

  // 1. Month-over-month change
  if (lastTotal > 0 && thisTotal > 0) {
    const pct = ((thisTotal - lastTotal) / lastTotal) * 100;
    const up = pct > 0;
    insights.push({
      icon: up ? TrendingUp : TrendingDown,
      color: up ? "text-red-600" : "text-emerald-600",
      bg: up ? "bg-red-50" : "bg-emerald-50",
      title: `Spending ${up ? "up" : "down"} ${Math.abs(pct).toFixed(0)}% vs last month`,
      body: `This month: ${formatCurrency(thisTotal)} vs ${formatCurrency(lastTotal)} last month.`,
    });
  }

  // 2. Daily average this month
  const daysElapsed = Math.max(1, differenceInCalendarDays(now, thisMonthStart) + 1);
  if (thisTotal > 0) {
    const dailyAvg = thisTotal / daysElapsed;
    insights.push({
      icon: CalendarDays,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      title: `You're averaging ${formatCurrency(dailyAvg)}/day this month`,
      body: `Based on ${daysElapsed} day${daysElapsed !== 1 ? "s" : ""} of data in ${format(now, "MMMM")}.`,
    });
  }

  // 3. Biggest single expense
  const biggest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  if (biggest) {
    insights.push({
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      title: `Biggest expense: ${formatCurrency(biggest.amount)}`,
      body: `"${biggest.description}" on ${format(parseISO(biggest.date), "MMM d, yyyy")}.`,
    });
  }

  // 4. Top category
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount;
  });
  const topCat = Object.entries(catTotals).sort(([, a], [, b]) => b - a)[0];
  if (topCat) {
    const pct = (topCat[1] / expenses.reduce((s, e) => s + e.amount, 0)) * 100;
    insights.push({
      icon: Zap,
      color: "text-violet-600",
      bg: "bg-violet-50",
      title: `${topCat[0]} is your biggest category`,
      body: `${formatCurrency(topCat[1])} total — ${pct.toFixed(0)}% of all spending.`,
    });
  }

  // 5. Most expensive day of week
  const dowTotals = Array(7).fill(0) as number[];
  const dowCounts = Array(7).fill(0) as number[];
  expenses.forEach((e) => {
    const dow = getDay(parseISO(e.date));
    dowTotals[dow] += e.amount;
    dowCounts[dow]++;
  });
  const dowAvg = dowTotals.map((t, i) => (dowCounts[i] > 0 ? t / dowCounts[i] : 0));
  const maxDow = dowAvg.indexOf(Math.max(...dowAvg));
  if (dowAvg[maxDow] > 0) {
    insights.push({
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50",
      title: `${DAYS[maxDow]}s are your most expensive day`,
      body: `Average of ${formatCurrency(dowAvg[maxDow])} per transaction on ${DAYS[maxDow]}s.`,
    });
  }

  // 6. No-spend category opportunity
  const allCats: Category[] = ["Food", "Transportation", "Entertainment", "Shopping", "Bills", "Travel", "Other"];
  const zeroCats = allCats.filter((c) => !catTotals[c]);
  if (zeroCats.length > 0 && zeroCats.length < allCats.length) {
    insights.push({
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      title: `Zero spending in ${zeroCats.length} categor${zeroCats.length === 1 ? "y" : "ies"}`,
      body: `${zeroCats.join(", ")} — nice work keeping those costs low!`,
    });
  }

  return insights;
}

export default function InsightsPanel({ expenses }: Props) {
  const insights = useMemo(() => computeInsights(expenses), [expenses]);

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Insights</h3>
        <p className="text-sm text-slate-400 text-center py-6">
          Add some expenses to unlock personalised insights.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        💡 Insights
      </h3>
      <div className="space-y-3">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${ins.bg}`}>
            <div className={`mt-0.5 shrink-0 ${ins.color}`}>
              <ins.icon className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${ins.color}`}>{ins.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{ins.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
