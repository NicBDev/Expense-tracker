import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember, isErrorResponse } from "@/lib/apiHelpers";

// GET /api/workspaces/[id]/members
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  const access = await requireWorkspaceMember(auth.userId, params.id);
  if (isErrorResponse(access)) return access;

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: params.id },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      joinedAt: m.joinedAt,
    }))
  );
}

// POST /api/workspaces/[id]/members — invite by email
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  const access = await requireWorkspaceMember(auth.userId, params.id);
  if (isErrorResponse(access)) return access;

  if (access.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot invite members" }, { status: 403 });
  }

  const { email, role = "member" } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!["member", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Role must be member or viewer" }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!invitee) {
    return NextResponse.json(
      { error: "No user found with that email. They must register first." },
      { status: 404 }
    );
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: params.id, userId: invitee.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  const member = await prisma.workspaceMember.create({
    data: { workspaceId: params.id, userId: invitee.id, role },
    include: { user: { select: { email: true, name: true } } },
  });

  return NextResponse.json(
    { userId: member.userId, email: member.user.email, name: member.user.name, role: member.role },
    { status: 201 }
  );
}

// DELETE /api/workspaces/[id]/members?userId=... — remove a member
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  const access = await requireWorkspaceMember(auth.userId, params.id);
  if (isErrorResponse(access)) return access;

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");
  if (!targetUserId) return NextResponse.json({ error: "userId query param required" }, { status: 400 });

  // Only owners can remove others; members can remove themselves
  if (access.role !== "owner" && targetUserId !== auth.userId) {
    return NextResponse.json({ error: "Only owners can remove other members" }, { status: 403 });
  }

  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: params.id, userId: targetUserId } },
  });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
  }

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId: params.id, userId: targetUserId } },
  });

  return new NextResponse(null, { status: 204 });
}
