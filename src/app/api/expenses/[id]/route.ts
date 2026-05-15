import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/apiHelpers";

// PATCH /api/expenses/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  // Only creator or workspace owner can edit
  if (expense.userId !== auth.userId) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: expense.workspaceId, userId: auth.userId } },
    });
    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "You can only edit your own expenses" }, { status: 403 });
    }
  }

  const { date, amount, category, description } = await req.json();
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

// DELETE /api/expenses/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  if (expense.userId !== auth.userId) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: expense.workspaceId, userId: auth.userId } },
    });
    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "You can only delete your own expenses" }, { status: 403 });
    }
  }

  await prisma.expense.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
