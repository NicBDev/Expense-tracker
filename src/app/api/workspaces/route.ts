import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/apiHelpers";

// GET /api/workspaces — list workspaces the current user belongs to
export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  const { userId } = auth;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: { select: { expenses: true, members: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(
    memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      expenseCount: m.workspace._count.expenses,
      memberCount: m.workspace._count.members,
      createdAt: m.workspace.createdAt,
    }))
  );
}

// POST /api/workspaces — create a new workspace
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  const { userId } = auth;

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      members: { create: { userId, role: "owner" } },
    },
  });

  return NextResponse.json({ id: workspace.id, name: workspace.name, role: "owner" }, { status: 201 });
}
