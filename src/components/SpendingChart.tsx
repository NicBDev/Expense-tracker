"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type SummaryStats } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  stats: SummaryStats;
}

export default function SpendingChart({ stats }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Monthly Spending (Last 6 Months)
      </h3>
      {stats.monthlyData.every((d) => d.total === 0) ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No data yet — add some expenses!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
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
              formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
