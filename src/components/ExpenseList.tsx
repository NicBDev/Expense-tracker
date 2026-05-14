"use client";

import { type Expense, type SortField, type SortOrder } from "@/types";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import { Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import clsx from "clsx";

interface Props {
  expenses: Expense[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const HEADERS: { label: string; field: SortField }[] = [
  { label: "Date", field: "date" },
  { label: "Description", field: "description" },
  { label: "Category", field: "category" },
  { label: "Amount", field: "amount" },
];

export default function ExpenseList({
  expenses,
  sortField,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: Props) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="text-4xl mb-3">💸</div>
        <p className="text-slate-700 font-medium mb-1">No expenses found</p>
        <p className="text-slate-400 text-sm">
          Add your first expense or adjust your filters.
        </p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {HEADERS.map(({ label, field }) => (
                <th
                  key={field}
                  onClick={() => onSort(field)}
                  className="px-5 py-3.5 text-left font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    {label}
                    <SortIcon field={field} />
                  </div>
                </th>
              ))}
              <th className="px-5 py-3.5 text-right font-medium text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-slate-50 transition-colors group"
              >
                <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                  {formatDate(expense.date)}
                </td>
                <td className="px-5 py-3.5 text-slate-800 max-w-xs truncate">
                  {expense.description}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[expense.category] + "20",
                      color: CATEGORY_COLORS[expense.category],
                    }}
                  >
                    {CATEGORY_ICONS[expense.category]}
                    {expense.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-4 flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                backgroundColor: CATEGORY_COLORS[expense.category] + "20",
              }}
            >
              {CATEGORY_ICONS[expense.category]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-800 truncate">
                  {expense.description}
                </p>
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">
                  {formatDate(expense.date)}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: CATEGORY_COLORS[expense.category] + "20",
                    color: CATEGORY_COLORS[expense.category],
                  }}
                >
                  {expense.category}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => onEdit(expense)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(expense.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
