"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { type Expense, type FilterState, type SortField, type SortOrder } from "@/types";
import { useExpenses, useFilteredExpenses } from "@/hooks/useExpenses";
import { computeStats, exportToCSV, formatCurrency } from "@/lib/utils";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import FilterBar from "@/components/FilterBar";
import { PlusCircle, Download, X } from "lucide-react";

const DEFAULT_FILTER: FilterState = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
};

function ExpensesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { expenses, hydrated, add, update, remove } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // open form from navbar CTA
  useEffect(() => {
    if (params.get("add") === "true") {
      setShowForm(true);
      router.replace("/expenses");
    }
  }, [params, router]);

  const filtered = useFilteredExpenses(expenses, filter, sortField, sortOrder);
  const stats = useMemo(() => computeStats(filtered), [filtered]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  }

  function handleSave(expense: Expense) {
    if (editing) {
      update(expense);
      showToast("Expense updated");
    } else {
      add(expense);
      showToast("Expense added");
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleEdit(expense: Expense) {
    setEditing(expense);
    setShowForm(true);
  }

  function handleDeleteRequest(id: string) {
    setDeleteConfirm(id);
  }

  function handleDeleteConfirm() {
    if (deleteConfirm) {
      remove(deleteConfirm);
      setDeleteConfirm(null);
      showToast("Expense deleted");
    }
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""} ·{" "}
            {formatCurrency(stats.totalAll)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button
              onClick={() => exportToCSV(filtered)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <FilterBar filter={filter} onChange={setFilter} />

      {/* List */}
      <ExpenseList
        expenses={filtered}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      {/* Slide-over form */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
          <div className="relative ml-auto w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl p-6">
            <ExpenseForm
              expense={editing}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Delete expense?
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in">
          {toast}
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <ExpensesContent />
    </Suspense>
  );
}
