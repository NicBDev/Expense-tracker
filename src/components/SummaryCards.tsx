"use client";

import { type SummaryStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Calendar, DollarSign, Receipt } from "lucide-react";

interface Props {
  stats: SummaryStats;
}

export default function SummaryCards({ stats }: Props) {
  const cards = [
    {
      label: "All Time Total",
      value: formatCurrency(stats.totalAll),
      sub: `${stats.count} expense${stats.count !== 1 ? "s" : ""}`,
      icon: DollarSign,
      color: "bg-indigo-500",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
    },
    {
      label: "This Month",
      value: formatCurrency(stats.totalThisMonth),
      sub: "Current month spending",
      icon: Calendar,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "This Year",
      value: formatCurrency(stats.totalThisYear),
      sub: "Year-to-date spending",
      icon: TrendingUp,
      color: "bg-violet-500",
      bg: "bg-violet-50",
      text: "text-violet-700",
    },
    {
      label: "Top Category",
      value: topCategory(stats),
      sub: "Highest spending category",
      icon: Receipt,
      color: "bg-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">{card.label}</span>
            <div className={`${card.bg} p-2 rounded-lg`}>
              <card.icon className={`w-4 h-4 ${card.text}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{card.value}</div>
          <div className="text-xs text-slate-400">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

function topCategory(stats: SummaryStats): string {
  const entries = Object.entries(stats.categoryTotals).filter(([, v]) => v > 0);
  if (!entries.length) return "—";
  const [cat] = entries.sort(([, a], [, b]) => b - a)[0];
  return cat;
}
