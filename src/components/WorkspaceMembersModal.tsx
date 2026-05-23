"use client";

import { useEffect, useState, useCallback } from "react";
import { X, UserPlus, Trash2, Crown, User, Eye, Loader2 } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: "owner" | "member" | "viewer";
  joinedAt: string;
}

interface Props {
  workspaceId: string;
  workspaceName: string;
  currentUserId: string;
  currentRole: string;
  onClose: () => void;
}

const roleIcons = {
  owner: Crown,
  member: User,
  viewer: Eye,
};

const roleColors = {
  owner: "text-amber-600 bg-amber-50",
  member: "text-indigo-600 bg-indigo-50",
  viewer: "text-slate-600 bg-slate-100",
};

export default function WorkspaceMembersModal({
  workspaceId,
  workspaceName,
  currentUserId,
  currentRole,
  onClose,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function invite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add member");
      } else {
        setSuccessMsg(`${data.name ?? data.email} added as ${inviteRole}`);
        setInviteEmail("");
        await fetchMembers();
      }
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    setRemovingId(userId);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members?userId=${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await fetchMembers();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to remove member");
      }
    } finally {
      setRemovingId(null);
    }
  }

  const canManage = currentRole === "owner" || currentRole === "member";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Workspace Members</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{workspaceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Members list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No members found.</p>
          ) : (
            members.map((m) => {
              const RoleIcon = roleIcons[m.role] ?? User;
              return (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-indigo-600">
                      {(m.name ?? m.email).charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {m.name ?? m.email}
                      {m.userId === currentUserId && (
                        <span className="ml-1.5 text-xs text-slate-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>

                  {/* Role badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[m.role] ?? "text-slate-600 bg-slate-100"}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {m.role}
                  </span>

                  {/* Remove button — owners can remove members/viewers; can't remove owner */}
                  {currentRole === "owner" && m.role !== "owner" && (
                    <button
                      onClick={() => removeMember(m.userId)}
                      disabled={removingId === m.userId}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Remove member"
                    >
                      {removingId === m.userId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Invite section — owners and members can invite */}
        {canManage && (
          <div className="px-6 py-4 border-t border-slate-100 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invite by email
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setError(null); setSuccessMsg(null); }}
                onKeyDown={(e) => e.key === "Enter" && invite()}
                placeholder="colleague@example.com"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "member" | "viewer")}
                className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-indigo-400 bg-white text-slate-700"
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            {successMsg && <p className="text-xs text-green-600">✓ {successMsg}</p>}

            <button
              onClick={invite}
              disabled={!inviteEmail.trim() || inviting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Member
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
