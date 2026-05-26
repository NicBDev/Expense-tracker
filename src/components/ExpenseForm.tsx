"use client";

import { useState, useEffect, memo } from "react";
import { type Expense, type Category } from "@/types";
import { CATEGORIES, generateId } from "@/lib/utils";
import { X, Save, PlusCircle, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  expense?: Expense | null;
  isSaving?: boolean;
  onSave: (expense: Expense) => Promise<void>;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const defaultForm = {
  date: today(),
  amount: "",
  category: "Food" as Category,
  description: "",
};

function ExpenseForm({ expense, isSaving = false, onSave, onCancel }: Props) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Combine external loading state with internal (covers both add and edit)
  const saving = submitting || isSaving;

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date,
        amount: String(expense.amount),
        category: expense.category,
        description: expense.description,
      });
    } else {
      setForm({ ...defaultForm, date: today() });
    }
    setErrors({});
  }, [expense]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = "Date is required";
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0)
      errs.amount = "Enter a valid positive amount";
    if (amt > 1_000_000) errs.amount = "Amount seems too large";
    if (!form.description.trim()) errs.description = "Description is required";
    if (form.description.trim().length > 200)
      errs.description = "Max 200 characters";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const saved: Expense = {
      id: expense?.id ?? generateId(),
      date: form.date,
      amount: parseFloat(parseFloat(form.amount).toFixed(2)),
      category: form.category,
      description: form.description.trim(),
      createdAt: expense?.createdAt ?? new Date().toISOString(),
    };
    setSubmitting(true);
    try {
      await onSave(saved);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    clsx(
      "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 bg-white outline-none transition-colors",
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-300"
        : "border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {expense ? "Edit Expense" : "New Expense"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputClass("date")}
            max={today()}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-500">{errors.date}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              $
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={clsx(inputClass("amount"), "pl-7")}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as Category })
            }
            className={inputClass("category")}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="What was this expense for?"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className={clsx(inputClass("description"), "resize-none")}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-slate-400">
              {form.description.length}/200
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : expense ? (
            <Save className="w-4 h-4" />
          ) : (
            <PlusCircle className="w-4 h-4" />
          )}
          {expense ? "Save Changes" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}

export default memo(ExpenseForm);
