import { notFound } from "next/navigation";
import { formatCurrency, formatDate, CATEGORY_ICONS } from "@/lib/utils";
import { type Category } from "@/types";
import { format, parseISO } from "date-fns";

interface ShareData {
  label: string;
  workspaceName: string;
  expiresAt: string;
  expenses: {
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    createdBy: string;
  }[];
}

async function getSharedData(token: string): Promise<ShareData | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/shared-links/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const data = await getSharedData(params.token);

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link unavailable</h1>
          <p className="text-slate-500 text-sm">
            This link may have expired, been revoked, or never existed.
          </p>
        </div>
      </div>
    );
  }

  const total = data.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Shared Report</p>
        <h1 className="text-2xl font-bold mb-1">{data.label}</h1>
        <p className="text-indigo-200 text-sm">
          {data.workspaceName} · Expires {format(parseISO(data.expiresAt), "MMM d, yyyy")}
        </p>
        <div className="mt-4 flex items-center gap-6">
          <div>
            <p className="text-indigo-200 text-xs">Expenses</p>
            <p className="text-2xl font-bold">{data.expenses.length}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs">Total</p>
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
        📖 This is a read-only view. To collaborate on this workspace,{" "}
        <a href="/register" className="underline font-medium">create an account</a>.
      </div>

      {/* Expense table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">All Transactions</h2>
        </div>
        {data.expenses.length === 0 ? (
          <p className="text-center py-10 text-slate-400 text-sm">No expenses in this report.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">By</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span>{CATEGORY_ICONS[e.category as Category]}</span>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{e.description}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.createdBy}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium text-right whitespace-nowrap">
                    {formatCurrency(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={4} className="px-4 py-3 font-semibold text-slate-700">Total</td>
                <td className="px-4 py-3 font-bold text-slate-900 text-right">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Powered by SpendWise · Read-only shared view
      </p>
    </div>
  );
}
