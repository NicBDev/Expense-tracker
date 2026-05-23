"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { type Expense } from "@/types";
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns";

interface Props {
  expenses: Expense[];
  days?: number;
}

export default function TrendChart({ expenses, days = 30 }: Props) {
  const today = new Date();
  const start = subDays(today, days - 1);

  // Build daily totals
  const dayMap: Record<string, number> = {};
  eachDayOfInterval({ start, end: today }).forEach((d) => {
    dayMap[format(d, "yyyy-MM-dd")] = 0;
  });
  expenses.forEach((e) => {
    if (e.date in dayMap) dayMap[e.date] += e.amount;
  });

  // Cumulative running total
  let running = 0;
  const data = Object.entries(dayMap).map(([date, total]) => {
    running += total;
    return {
      date: format(parseISO(date), "MMM d"),
      daily: total,
      cumulative: running,
    };
  });

  const hasData = expenses.some((e) => e.date >= format(start, "yyyy-MM-dd"));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Spending Trend — Last {days} Days
        </h3>
        <span className="text-xs text-slate-400">Cumulative</span>
      </div>
      {!hasData ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No data in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(days / 6)}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === "cumulative" ? "Cumulative" : "Daily",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#cumulativeGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
