import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/shared-links/[token] — public endpoint, no auth required
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const link = await prisma.sharedLink.findUnique({
    where: { token: params.token },
    include: { workspace: { select: { name: true } } },
  });

  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });
  if (!link.active) return NextResponse.json({ error: "This link has been revoked" }, { status: 410 });
  if (new Date() > link.expiresAt) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // Increment view count
  await prisma.sharedLink.update({
    where: { id: link.id },
    data: { views: { increment: 1 } },
  });

  // Fetch expenses for the workspace
  const expenses = await prisma.expense.findMany({
    where: { workspaceId: link.workspaceId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    label: link.label,
    workspaceName: link.workspace.name,
    expiresAt: link.expiresAt.toISOString(),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description,
      createdBy: e.user.name ?? e.user.email,
    })),
  });
}
