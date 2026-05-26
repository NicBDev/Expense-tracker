import { NextResponse } from "next/server";

// ─── Auth mock factories ──────────────────────────────────────────────────────

/** Simulates a valid authenticated session returning the given userId. */
export const authedAs = (userId: string) =>
  jest.fn().mockResolvedValue({ userId });

/** Simulates an unauthenticated request (no session). */
export const notAuthed = () =>
  jest.fn().mockResolvedValue(
    NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  );

/** Simulates a user who is a member of the workspace with the given role. */
export const memberWithRole = (role: "owner" | "member" | "viewer") =>
  jest.fn().mockResolvedValue({ role });

/** Simulates a user who is not a member of the workspace. */
export const notAMember = () =>
  jest.fn().mockResolvedValue(
    NextResponse.json({ error: "Workspace not found or access denied" }, { status: 403 })
  );

// ─── Request factories ────────────────────────────────────────────────────────

export function patchRequest(body: Record<string, unknown>, url = "http://localhost/api/expenses/exp1") {
  return new Request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteRequest(url: string) {
  return new Request(url, { method: "DELETE" });
}

// ─── Prisma expense fixture ───────────────────────────────────────────────────

export const makeExpense = (overrides: Partial<{
  id: string;
  workspaceId: string;
  userId: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}> = {}) => ({
  id: "exp1",
  workspaceId: "ws1",
  userId: "user1",
  date: "2026-05-01",
  amount: 42.0,
  category: "Food",
  description: "Lunch",
  createdAt: new Date("2026-05-01T12:00:00Z"),
  updatedAt: new Date("2026-05-01T12:00:00Z"),
  user: { id: "user1", name: "Alice", email: "alice@example.com" },
  ...overrides,
});

// ─── Prisma shared link fixture ───────────────────────────────────────────────

export const makeSharedLink = (overrides: Partial<{
  id: string;
  workspaceId: string;
  userId: string;
}> = {}) => ({
  id: "link1",
  workspaceId: "ws1",
  userId: "user1",
  label: "Q1 Report",
  token: "abc123",
  expiresAt: new Date("2026-06-01"),
  views: 5,
  active: true,
  createdAt: new Date("2026-05-01T12:00:00Z"),
  ...overrides,
});
