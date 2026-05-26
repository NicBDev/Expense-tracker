import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember, isErrorResponse } from "@/lib/apiHelpers";

// PATCH /api/expenses/[id]
// Requires workspaceId in the request body so membership can be verified
// before revealing whether the expense exists.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const body = await req.json();
  const { workspaceId, date, amount, category, description } = body;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  // Verify workspace membership BEFORE fetching the expense — prevents leaking
  // whether an expense ID exists to users outside the workspace.
  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  if (access.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot edit expenses" }, { status: 403 });
  }

  // Fetch workspace-scoped — a non-existent ID and a wrong-workspace ID both return 404.
  const expense = await prisma.expense.findUnique({
    where: { id: params.id, workspaceId },
  });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  // Only the creator or a workspace owner can edit.
  if (expense.userId !== auth.userId && access.role !== "owner") {
    return NextResponse.json({ error: "You can only edit your own expenses" }, { status: 403 });
  }

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...(date && { date }),
      ...(amount != null && { amount }),
      ...(category && { category }),
      ...(description && { description }),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    id: updated.id,
    date: updated.date,
    amount: updated.amount,
    category: updated.category,
    description: updated.description,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    createdBy: { id: updated.user.id, name: updated.user.name, email: updated.user.email },
  });
}

// DELETE /api/expenses/[id]?workspaceId=...
// Requires workspaceId as a query param so membership can be verified
// before revealing whether the expense exists.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  // Verify workspace membership BEFORE fetching the expense.
  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  if (access.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot delete expenses" }, { status: 403 });
  }

  // Fetch workspace-scoped — prevents cross-workspace ID enumeration.
  const expense = await prisma.expense.findUnique({
    where: { id: params.id, workspaceId },
  });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  // Only the creator or a workspace owner can delete.
  if (expense.userId !== auth.userId && access.role !== "owner") {
    return NextResponse.json({ error: "You can only delete your own expenses" }, { status: 403 });
  }

  await prisma.expense.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
