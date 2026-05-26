"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Cloud,
  Download,
  Calendar,
  History,
  Share2,
  Check,
  Copy,
  Link2,
  Zap,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  QrCode,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import { type Expense } from "@/types";
import {
  DESTINATIONS,
  TEMPLATES,
  type Destination,
  type DestinationId,
  type ExportTemplate,
  type TemplateId,
  type Frequency,
  type ExportHistoryItem,
  type ScheduledExport,
  type SharedLink,
  loadConnections,
  saveConnections,
  runExportWithHistory,
  generateQRGrid,
} from "@/lib/cloudExport";
import { format, parseISO, formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "export" | "schedule" | "history" | "share";

interface Props {
  expenses: Expense[];
  workspaceId: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CloudExportPanel({ expenses, workspaceId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("export");

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
    { id: "schedule", label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <History className="w-4 h-4" /> },
    { id: "share", label: "Share", icon: <Share2 className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold text-lg">SpendWise Cloud</span>
            </div>
            <p className="text-indigo-200 text-sm">
              Export, sync, schedule, and share your data
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expense count pill */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs text-indigo-700 font-medium">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} in your workspace
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 bg-white px-2 pt-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                tab === t.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "export" && <ExportTab expenses={expenses} workspaceId={workspaceId} />}
          {tab === "schedule" && <ScheduleTab workspaceId={workspaceId} />}
          {tab === "history" && <HistoryTab workspaceId={workspaceId} />}
          {tab === "share" && <ShareTab workspaceId={workspaceId} />}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Export ──────────────────────────────────────────────────────────────

function ExportTab({ expenses, workspaceId }: { expenses: Expense[]; workspaceId: string }) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("monthly_summary");
  const [selectedDest, setSelectedDest] = useState<DestinationId>("email");
  const [format, setFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [connections, setConnections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = loadConnections();
    setConnections(saved);
  }, []);

  const template = TEMPLATES.find((t) => t.id === selectedTemplate)!;
  const dest = DESTINATIONS.find((d) => d.id === selectedDest)!;

  useEffect(() => {
    setFormat(template.defaultFormat);
  }, [selectedTemplate]);

  function toggleConnection(id: DestinationId) {
    const next = { ...connections, [id]: !connections[id] };
    setConnections(next);
    saveConnections(next as Record<DestinationId, boolean>);
  }

  function isConnected(dest: Destination) {
    return dest.id === "email" ? true : !!connections[dest.id];
  }

  async function runExport() {
    setRunning(true);
    setDone(false);
    setProgress(0);
    // Filter expenses by template filterPreset
    let filtered = expenses;
    if (template.filterPreset?.months) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - template.filterPreset.months);
      filtered = expenses.filter((e) => new Date(e.date) >= cutoff);
    }
    if (template.filterPreset?.categories?.length) {
      filtered = filtered.filter((e) =>
        (template.filterPreset!.categories! as string[]).includes(e.category)
      );
    }
    await runExportWithHistory(filtered, template, dest, format, setProgress);
    // Record in API
    try {
      await fetch("/api/export-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          templateName: template.name,
          destinationName: dest.name,
          destinationIcon: dest.icon,
          format,
          recordCount: filtered.length,
          fileSize: `${Math.round(filtered.length * 0.5)}KB`,
        }),
      });
    } catch {/* best effort */}
    setRunning(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Templates */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Export Template
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={clsx(
                "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                selectedTemplate === t.id
                  ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span className="text-xl mt-0.5">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{t.name}</span>
                  {t.defaultFormat === "pdf" && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                      PDF
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
              </div>
              {selectedTemplate === t.id && (
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Send To
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {DESTINATIONS.map((d) => {
            const connected = isConnected(d);
            return (
              <div
                key={d.id}
                className={clsx(
                  "relative rounded-xl border p-3 transition-all",
                  d.comingSoon
                    ? "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
                    : selectedDest === d.id
                    ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300 cursor-pointer"
                    : "border-slate-200 hover:border-slate-300 cursor-pointer"
                )}
                onClick={() => !d.comingSoon && setSelectedDest(d.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{d.icon}</span>
                  <div className="flex items-center gap-1">
                    {d.comingSoon ? (
                      <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-semibold uppercase">
                        Soon
                      </span>
                    ) : (
                      <>
                        <div
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            connected ? "bg-emerald-400" : "bg-slate-300"
                          )}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!d.comingSoon && d.id !== "email") toggleConnection(d.id);
                          }}
                          className={clsx(
                            "text-[10px] font-medium transition-colors",
                            d.id === "email"
                              ? "text-emerald-600 cursor-default"
                              : connected
                              ? "text-emerald-600 hover:text-red-500"
                              : "text-slate-400 hover:text-indigo-600"
                          )}
                        >
                          {d.id === "email" ? "Default" : connected ? "On" : "Connect"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-700">{d.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{d.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Format */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Format
        </h3>
        <div className="flex gap-2">
          {(["csv", "json", "pdf"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={clsx(
                "flex-1 py-2 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-colors",
                format === f
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-slate-300 text-slate-600 hover:border-slate-400"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {format === "pdf" && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            PDF exports will download as CSV in this demo
          </p>
        )}
      </section>

      {/* Run */}
      <div className="space-y-3">
        {running && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Preparing export…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={runExport}
          disabled={running || (dest.id !== "email" && !isConnected(dest))}
          className={clsx(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
            done
              ? "bg-emerald-500 text-white"
              : running
              ? "bg-indigo-400 text-white cursor-wait"
              : dest.id !== "email" && !isConnected(dest)
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
          )}
        >
          {done ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Export Sent!
            </>
          ) : running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Exporting…
            </>
          ) : dest.id !== "email" && !isConnected(dest) ? (
            <>
              <WifiOff className="w-4 h-4" /> Connect {dest.name} First
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export {template.name} via {dest.name}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Schedule ────────────────────────────────────────────────────────────

function ScheduleTab({ workspaceId }: { workspaceId: string }) {
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("monthly_summary");
  const [destId, setDestId] = useState<DestinationId>("email");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/schedules?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => setSchedules(data))
      .catch(() => {});
  }, [workspaceId]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, templateId, destinationId: destId, frequency }),
      });
      if (res.ok) {
        const s = await res.json();
        setSchedules((prev) => [s, ...prev]);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleSchedule(id: string) {
    const s = schedules.find((s) => s.id === id);
    if (!s) return;
    const res = await fetch(`/api/schedules?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  }

  async function deleteSchedule(id: string) {
    const res = await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
    if (res.ok) setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  const freqLabels: Record<Frequency, string> = {
    daily: "Every day",
    weekly: "Every week",
    monthly: "Every month",
    quarterly: "Every quarter",
  };

  return (
    <div className="p-6 space-y-6">
      {/* New schedule form */}
      <section className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-500" />
          New Scheduled Export
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Template
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as TemplateId)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 bg-white"
            >
              {TEMPLATES.filter((t) => t.id !== "custom").map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Destination
            </label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value as DestinationId)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 bg-white"
            >
              {DESTINATIONS.filter((d) => !d.comingSoon).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Frequency
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["daily", "weekly", "monthly", "quarterly"] as Frequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={clsx(
                    "py-1.5 rounded-lg border text-xs font-medium transition-colors capitalize",
                    frequency === f
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className={clsx(
            "w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          )}
        >
          {saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Schedule Created!</>
          ) : creating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
          ) : (
            <><Clock className="w-4 h-4" /> Create Schedule</>
          )}
        </button>
      </section>

      {/* Existing schedules */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Active Schedules
        </h3>
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No schedules yet</p>
            <p className="text-xs mt-1">Create one above to automate your exports</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((s) => {
              const tmpl = TEMPLATES.find((t) => t.id === s.templateId);
              const dest = DESTINATIONS.find((d) => d.id === s.destinationId);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white"
                >
                  <div className="text-xl shrink-0">{tmpl?.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{tmpl?.name}</p>
                      <span className="text-xs text-slate-400">→ {dest?.icon} {dest?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={clsx(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium",
                        s.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                      )}>
                        {freqLabels[s.frequency]}
                      </span>
                      <span className="text-xs text-slate-400">
                        Next: {format(parseISO(s.nextRun), "MMM d")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleSchedule(s.id)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {s.active
                        ? <ToggleRight className="w-5 h-5 text-indigo-500" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteSchedule(s.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────────────────

function HistoryTab({ workspaceId }: { workspaceId: string }) {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/export-history?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => setHistory(data))
      .catch(() => {});
  }, [workspaceId]);

  async function clearHistory() {
    const res = await fetch(`/api/export-history?workspaceId=${workspaceId}`, { method: "DELETE" });
    if (res.ok) setHistory([]);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Export History
        </h3>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No exports yet</p>
          <p className="text-xs mt-1">Your export history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white"
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {item.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : item.status === "failed" ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.templateName}
                  </p>
                  <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono shrink-0">
                    {item.format}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-500">
                    {item.destinationIcon} {item.destinationName}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">
                    {item.recordCount} records · {item.fileSize}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Share ───────────────────────────────────────────────────────────────

function ShareTab({ workspaceId }: { workspaceId: string }) {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [label, setLabel] = useState("My Expense Report");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/shared-links?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data: Array<SharedLink & { token: string }>) =>
        setLinks(
          data.map((l) => ({
            ...l,
            url: l.url ?? `${window.location.origin}/share/${l.token}`,
          }))
        )
      )
      .catch(() => {});
  }, [workspaceId]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/shared-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, label: label || "Shared Report" }),
      });
      if (res.ok) {
        const l = await res.json();
        const withUrl: SharedLink = { ...l, url: `${window.location.origin}/share/${l.token}` };
        setLinks((prev) => [withUrl, ...prev]);
        setLabel("My Expense Report");
      }
    } finally {
      setCreating(false);
    }
  }

  function copyLink(link: SharedLink) {
    navigator.clipboard.writeText(link.url).catch(() => {});
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function revokeLink(id: string) {
    const res = await fetch(`/api/shared-links?id=${id}&workspaceId=${workspaceId}`, { method: "PATCH" });
    if (res.ok) setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, active: false } : l)));
  }

  const activeLinks = links.filter((l) => l.active);
  const revokedLinks = links.filter((l) => !l.active);

  return (
    <div className="p-6 space-y-6">
      {/* Create link */}
      <section className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-500" />
          Generate Shareable Link
        </h3>
        <p className="text-xs text-slate-500">
          Create a read-only link to share your expense data. Links expire in 7 days.
        </p>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Link label…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 bg-white"
        />
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {creating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          ) : (
            <><Share2 className="w-4 h-4" /> Create Link</>
          )}
        </button>
      </section>

      {/* Active links */}
      {activeLinks.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Active Links
          </h3>
          <div className="space-y-2">
            {activeLinks.map((link) => (
              <div key={link.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{link.label}</p>
                      <p className="text-xs text-indigo-600 truncate mt-0.5">{link.url}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">
                          Expires {formatDistanceToNow(parseISO(link.expiresAt), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-slate-400">
                          {link.views} view{link.views !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setShowQR(showQR === link.id ? null : link.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyLink(link)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Copy link"
                      >
                        {copiedId === link.id
                          ? <Check className="w-4 h-4 text-emerald-500" />
                          : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => revokeLink(link.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Revoke"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code panel */}
                {showQR === link.id && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 flex flex-col items-center gap-2">
                    <p className="text-xs text-slate-500 mb-1">Scan to open this report</p>
                    <QRCodeGrid seed={link.id} />
                    <p className="text-[10px] text-slate-400 text-center mt-1 max-w-[180px] break-all">
                      {link.url}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Revoked notice */}
      {revokedLinks.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Revoked ({revokedLinks.length})
          </h3>
          <div className="space-y-1.5">
            {revokedLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="text-xs text-slate-400 truncate">{link.label}</span>
                <span className="text-xs text-slate-300 ml-auto shrink-0">Revoked</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cloud integrations teaser */}
      <section className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-indigo-100 p-4">
        <h3 className="text-sm font-semibold text-indigo-800 mb-1 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email Sharing
        </h3>
        <p className="text-xs text-indigo-600 mb-3">
          Send this report directly to anyone's inbox without them needing an account.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="colleague@company.com"
            className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400"
          />
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
            Send
          </button>
        </div>
        <p className="text-[10px] text-indigo-400 mt-2">
          ✦ Simulated — no email is actually sent in this demo
        </p>
      </section>
    </div>
  );
}

// ─── QR Code visual (cosmetic grid) ──────────────────────────────────────────

function QRCodeGrid({ seed }: { seed: string }) {
  const grid = generateQRGrid(seed);
  return (
    <div
      className="border-4 border-white shadow-sm rounded-lg overflow-hidden"
      style={{ display: "grid", gridTemplateRows: `repeat(${grid.length}, 1fr)` }}
    >
      {grid.map((row, r) => (
        <div key={r} style={{ display: "flex" }}>
          {row.map((cell, c) => (
            <div
              key={c}
              style={{
                width: 8,
                height: 8,
                backgroundColor: cell ? "#1e1b4b" : "#ffffff",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
