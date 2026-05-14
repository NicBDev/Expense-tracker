"use client";

import { type FilterState, type Category } from "@/types";
import { CATEGORIES } from "@/lib/utils";
import { Search, X } from "lucide-react";

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
}

export default function FilterBar({ filter, onChange }: Props) {
  const set = (patch: Partial<FilterState>) =>
    onChange({ ...filter, ...patch });

  const hasActive =
    filter.search || filter.category !== "All" || filter.dateFrom || filter.dateTo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search expenses..."
          value={filter.search}
          onChange={(e) => set({ search: e.target.value })}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Category */}
        <select
          value={filter.category}
          onChange={(e) =>
            set({ category: e.target.value as Category | "All" })
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filter.dateFrom}
          onChange={(e) => set({ dateFrom: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
          placeholder="From"
        />

        {/* Date to */}
        <input
          type="date"
          value={filter.dateTo}
          onChange={(e) => set({ dateTo: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
          placeholder="To"
        />
      </div>

      {hasActive && (
        <button
          onClick={() =>
            onChange({ search: "", category: "All", dateFrom: "", dateTo: "" })
          }
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <X className="w-3 h-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
