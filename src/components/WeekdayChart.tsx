"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { type Expense } from "@/types";
import { parseISO, getDay } from "date-fns";

interface Props {
  expenses: Expense[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekdayChart({ expenses }: Props) {
  const totals = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];

  expenses.forEach((e) => {
    const dow = getDay(parseISO(e.date));
    totals[dow] += e.amount;
    counts[dow]++;
  });

  const data = DAYS.map((day, i) => ({
    day,
    avg: counts[i] > 0 ? totals[i] / counts[i] : 0,
    total: totals[i],
    count: counts[i],
  }));

  const maxVal = Math.max(...data.map((d) => d.avg));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Avg Spend by Day of Week
        </h3>
        <span className="text-xs text-slate-400">Per transaction avg</span>
      </div>
      {expenses.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No data yet — add some expenses!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
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
              formatter={(value, _name, props) => [
                formatCurrency(Number(value)),
                `Avg (${props.payload?.count ?? 0} tx)`,
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.avg === maxVal && maxVal > 0 ? "#f97316" : "#6366f1"}
                  fillOpacity={entry.avg === 0 ? 0.2 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
