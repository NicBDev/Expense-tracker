import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember, isErrorResponse } from "@/lib/apiHelpers";

// GET /api/expenses?workspaceId=...
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  const expenses = await prisma.expense.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    expenses.map((e) => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      createdBy: { id: e.user.id, name: e.user.name, email: e.user.email },
    }))
  );
}

// POST /api/expenses
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const body = await req.json();
  const { workspaceId, date, amount, category, description } = body;

  if (!workspaceId || !date || amount == null || !category || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;
  if (access.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot add expenses" }, { status: 403 });
  }

  const expense = await prisma.expense.create({
    data: {
      workspaceId,
      userId: auth.userId,
      date,
      amount,
      category,
      description,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    {
      id: expense.id,
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      createdBy: { id: expense.user.id, name: expense.user.name, email: expense.user.email },
    },
    { status: 201 }
  );
}
