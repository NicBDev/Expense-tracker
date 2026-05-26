"use client";

import { memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { type SummaryStats, type Category } from "@/types";
import { CATEGORY_COLORS, formatCurrency } from "@/lib/utils";

interface Props {
  stats: SummaryStats;
}

function CategoryChart({ stats }: Props) {
  const data = (Object.entries(stats.categoryTotals) as [Category, number][])
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Spending by Category
      </h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No data yet — add some expenses!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map(({ name }) => (
                <Cell
                  key={name}
                  fill={CATEGORY_COLORS[name as Category]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
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
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default memo(CategoryChart);
