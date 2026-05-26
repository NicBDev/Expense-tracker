"use client";

import { useToast } from "@/contexts/ToastContext";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "border-l-emerald-400 text-emerald-300",
  error: "border-l-red-400 text-red-300",
  info: "border-l-indigo-400 text-indigo-300",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className={clsx(
              "flex items-start gap-3 px-4 py-3 rounded-xl",
              "bg-slate-900 border border-slate-700 border-l-4 shadow-lg",
              "animate-in slide-in-from-right-4 fade-in duration-200",
              styles[toast.type]
            )}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="flex-1 text-sm text-slate-100 leading-snug">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
