"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  X,
  FileText,
  FileJson,
  File,
  ChevronDown,
  ChevronUp,
  Check,
  Download,
  Eye,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { type Expense, type Category } from "@/types";
import {
  type ExportFormat,
  type ExportConfig,
  applyExportFilters,
  runExport,
} from "@/lib/exportUtils";
import { CATEGORIES, CATEGORY_ICONS, formatCurrency, formatDate } from "@/lib/utils";
import { format } from "date-fns";

interface ExportModalProps {
  expenses: Expense[];
  onClose: () => void;
}

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  desc: string;
  ext: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "csv",
    label: "CSV",
    desc: "Spreadsheet compatible. Opens in Excel, Google Sheets, and Numbers.",
    ext: ".csv",
    icon: <FileText className="w-5 h-5" />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "json",
    label: "JSON",
    desc: "Structured data format. Ideal for developers and API integrations.",
    ext: ".json",
    icon: <FileJson className="w-5 h-5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    id: "pdf",
    label: "PDF",
    desc: "Formatted report with category summary. Ready to print or share.",
    ext: ".pdf",
    icon: <File className="w-5 h-5" />,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
];

const PREVIEW_PAGE_SIZE = 5;

export default function ExportModal({ expenses, onClose }: ExportModalProps) {
  // --- State ---
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCats, setSelectedCats] = useState<Category[]>([...CATEGORIES]);
  const [filename, setFilename] = useState(
    `expenses-${new Date().toISOString().slice(0, 10)}`
  );
  const [previewPage, setPreviewPage] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // Reset preview page when filters change
  useEffect(() => {
    setPreviewPage(0);
  }, [startDate, endDate, selectedCats]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // --- Derived ---
  const filteredExpenses = useMemo(
    () =>
      applyExportFilters(expenses, {
        startDate,
        endDate,
        categories: selectedCats,
      }).sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, startDate, endDate, selectedCats]
  );

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const previewSlice = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    return filteredExpenses.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [filteredExpenses, previewPage]);

  const totalPreviewPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / PREVIEW_PAGE_SIZE)
  );

  // --- Handlers ---
  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const allSelected = selectedCats.length === CATEGORIES.length;
  const toggleAll = () => {
    setSelectedCats(allSelected ? [] : [...CATEGORIES]);
  };

  const handleExport = async () => {
    if (filteredExpenses.length === 0) return;
    setExporting(true);
    const config: ExportConfig = {
      format,
      filename: filename.trim() || "expenses-export",
      filters: { startDate, endDate, categories: selectedCats },
    };
    try {
      await runExport(expenses, config);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } finally {
      setExporting(false);
    }
  };

  const selectedFormatMeta = FORMAT_OPTIONS.find((f) => f.id === format)!;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", background: "rgba(15,23,42,0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal shell */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Export Data</h2>
              <p className="text-xs text-slate-500">
                Configure and download your expense data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── SECTION 1: FORMAT ── */}
          <section>
            <SectionLabel icon={<File className="w-4 h-4" />} label="Export Format" />
            <div className="grid grid-cols-3 gap-3 mt-3">
              {FORMAT_OPTIONS.map((opt) => {
                const active = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={`relative border-2 rounded-xl p-4 text-left transition-all ${
                      active
                        ? `${opt.color} border-current shadow-sm`
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {active && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-current flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <div className={`mb-2 ${active ? "" : "text-slate-500"}`}>
                      {opt.icon}
                    </div>
                    <div className={`font-bold text-sm ${active ? "" : "text-slate-700"}`}>
                      {opt.label}
                      <span className="ml-1 opacity-60 font-normal">{opt.ext}</span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${active ? "opacity-80" : "text-slate-400"}`}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── SECTION 2: DATE RANGE ── */}
          <section>
            <SectionLabel
              icon={<SlidersHorizontal className="w-4 h-4" />}
              label="Date Range"
              hint="Leave blank to include all dates"
            />
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end pb-2 text-slate-400 text-sm select-none">→</div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* ── SECTION 3: CATEGORIES ── */}
          <section>
            <div className="flex items-center justify-between">
              <SectionLabel
                icon={<SlidersHorizontal className="w-4 h-4" />}
                label="Categories"
                hint={`${selectedCats.length} of ${CATEGORIES.length} selected`}
              />
              <button
                onClick={toggleAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {CATEGORIES.map((cat) => {
                const active = selectedCats.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    <span>{CATEGORY_ICONS[cat]}</span>
                    {cat}
                  </button>
                );
              })}
            </div>
            {selectedCats.length === 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                No categories selected — export will be empty
              </div>
            )}
          </section>

          {/* ── SECTION 4: FILENAME ── */}
          <section>
            <SectionLabel
              icon={<FileText className="w-4 h-4" />}
              label="File Name"
            />
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="expenses-export"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              />
              <span className="text-sm text-slate-400 whitespace-nowrap">
                {selectedFormatMeta.ext}
              </span>
            </div>
          </section>

          {/* ── SECTION 5: PREVIEW ── */}
          <section>
            <div className="flex items-center justify-between">
              <SectionLabel icon={<Eye className="w-4 h-4" />} label="Data Preview" />
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showPreview ? (
                  <>Hide <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Show <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {showPreview && (
              <div className="mt-3">
                {filteredExpenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400">
                    <AlertCircle className="w-6 h-6 mb-2" />
                    <p className="text-sm font-medium">No data matches your filters</p>
                    <p className="text-xs mt-1">Adjust date range or categories</p>
                  </div>
                ) : (
                  <>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left">
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Date
                            </th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Category
                            </th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Description
                            </th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewSlice.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                {formatDate(e.date)}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="flex items-center gap-1.5 text-slate-700">
                                  <span>{CATEGORY_ICONS[e.category]}</span>
                                  {e.category}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-700 max-w-[180px] truncate">
                                {e.description}
                              </td>
                              <td className="px-3 py-2.5 text-slate-900 font-medium text-right whitespace-nowrap">
                                {formatCurrency(e.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPreviewPages > 1 && (
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>
                          Showing {previewPage * PREVIEW_PAGE_SIZE + 1}–
                          {Math.min(
                            (previewPage + 1) * PREVIEW_PAGE_SIZE,
                            filteredExpenses.length
                          )}{" "}
                          of {filteredExpenses.length}
                        </span>
                        <div className="flex gap-1">
                          <button
                            disabled={previewPage === 0}
                            onClick={() => setPreviewPage((p) => p - 1)}
                            className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ‹ Prev
                          </button>
                          <button
                            disabled={previewPage >= totalPreviewPages - 1}
                            onClick={() => setPreviewPage((p) => p + 1)}
                            className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Next ›
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Footer / Export summary + CTA ── */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 shrink-0">
          {/* Export summary bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm">
              <SummaryPill
                label="Records"
                value={filteredExpenses.length.toString()}
                accent={filteredExpenses.length > 0}
              />
              <SummaryPill
                label="Total"
                value={formatCurrency(totalAmount)}
                accent={totalAmount > 0}
              />
              <SummaryPill
                label="Format"
                value={`${selectedFormatMeta.label} (${selectedFormatMeta.ext})`}
                accent
              />
            </div>

            {exported && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                Export complete!
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || filteredExpenses.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                filteredExpenses.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : exporting
                  ? "bg-indigo-400 text-white cursor-wait"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md"
              }`}
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing export…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {filteredExpenses.length > 0 ? filteredExpenses.length : ""}{" "}
                  {filteredExpenses.length === 1 ? "record" : "records"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function SectionLabel({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {hint && <span className="text-xs text-slate-400">— {hint}</span>}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400 text-xs">{label}:</span>
      <span
        className={`font-semibold text-xs ${accent ? "text-indigo-700" : "text-slate-500"}`}
      >
        {value}
      </span>
    </div>
  );
}
