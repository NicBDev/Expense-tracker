"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/utils";
import { type Expense, type Category } from "@/types";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

interface Props {
  expenses: Expense[];
}

export default function MonthComparisonChart({ expenses }: Props) {
  const now = new Date();

  // Build last 3 months of per-category totals
  const months = [2, 1, 0].map((offset) => {
    const d = subMonths(now, offset);
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMM yyyy");
    const monthStart = startOfMonth(d);
    const monthEnd = startOfMonth(subMonths(d, -1));

    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      const date = parseISO(e.date);
      if (date >= monthStart && date < monthEnd) {
        totals[e.category] = (totals[e.category] ?? 0) + e.amount;
      }
    });

    return { label, key, ...totals };
  });

  // Determine which categories actually appear
  const activeCategories = Array.from(
    new Set(expenses.map((e) => e.category))
  ) as Category[];

  const hasData = months.some((m) =>
    activeCategories.some((c) => (m as Record<string, unknown>)[c])
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Month-over-Month by Category
      </h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No data yet — add some expenses!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={months} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value))]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 12, color: "#475569" }}>{value}</span>
              )}
            />
            {activeCategories.map((cat) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="a"
                fill={CATEGORY_COLORS[cat]}
                radius={activeCategories.indexOf(cat) === activeCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
