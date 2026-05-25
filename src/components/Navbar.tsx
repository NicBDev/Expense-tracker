"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  BarChart3, List, PlusCircle, Wallet, ChevronDown,
  LogOut, User, Building2, Plus, Check, Users, TrendingUp, Tag, Store, Lightbulb,
} from "lucide-react";
import clsx from "clsx";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import WorkspaceMembersModal from "@/components/WorkspaceMembersModal";

const navLinks = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/expenses", label: "Expenses", icon: List },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/monthly-insights", label: "Insights", icon: Lightbulb },
  { href: "/top-expense-categories", label: "Top Categories", icon: Tag },
  { href: "/top-vendors", label: "Top Vendors", icon: Store },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { workspaceId, setWorkspaceId, workspaces, currentWorkspace, refreshWorkspaces } = useWorkspace();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  async function createWorkspace() {
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWsName.trim() }),
      });
      if (res.ok) {
        const ws = await res.json();
        await refreshWorkspaces();
        setWorkspaceId(ws.id);
        setNewWsName("");
        setWorkspaceOpen(false);
      }
    } finally {
      setCreatingWs(false);
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg hidden sm:inline">SpendWise</span>

            {/* Workspace switcher */}
            {session && workspaces.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setWorkspaceOpen((v) => !v); setUserOpen(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium text-slate-700"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[120px] truncate">{currentWorkspace?.name ?? "Select workspace"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {workspaceOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setWorkspaceOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 z-20 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-1 overflow-hidden">
                      <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspaces</p>
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => { setWorkspaceId(ws.id); setWorkspaceOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{ws.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{ws.role} · {ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""}</p>
                          </div>
                          {ws.id === workspaceId && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </button>
                      ))}
                      {/* Manage members for current workspace */}
                      {currentWorkspace && (
                        <button
                          onClick={() => { setWorkspaceOpen(false); setMembersOpen(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Manage Members
                        </button>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1 px-2 pb-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newWsName}
                            onChange={(e) => setNewWsName(e.target.value)}
                            placeholder="New workspace name…"
                            onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                            className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
                          />
                          <button
                            onClick={createWorkspace}
                            disabled={!newWsName.trim() || creatingWs}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Nav links */}
          {session && (
            <nav className="flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Link
                  href="/expenses?add=true"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Expense</span>
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => { setUserOpen((v) => !v); setWorkspaceOpen(false); }}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1 overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-800 truncate">{session.user?.name ?? "User"}</p>
                          <p className="text-xs text-slate-400 truncate">{session.user?.email}</p>
                        </div>
                        <button
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Members Modal */}
      {membersOpen && currentWorkspace && session?.user && (
        <WorkspaceMembersModal
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          currentUserId={(session.user as { id?: string }).id ?? ""}
          currentRole={currentWorkspace.role}
          onClose={() => setMembersOpen(false)}
        />
      )}
    </header>
  );
}
