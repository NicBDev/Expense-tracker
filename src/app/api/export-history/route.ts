import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember, isErrorResponse } from "@/lib/apiHelpers";

// GET /api/export-history?workspaceId=...
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  const history = await prisma.exportHistory.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(
    history.map((h) => ({
      id: h.id,
      templateName: h.templateName,
      destinationName: h.destinationName,
      destinationIcon: h.destinationIcon,
      format: h.format,
      recordCount: h.recordCount,
      fileSize: h.fileSize,
      status: h.status,
      timestamp: h.createdAt.toISOString(),
      exportedBy: h.user.name ?? h.user.email,
    }))
  );
}

// POST /api/export-history — called after a successful export
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { workspaceId, templateName, destinationName, destinationIcon, format, recordCount, fileSize, status = "success" } =
    await req.json();

  if (!workspaceId || !templateName || !destinationName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  const item = await prisma.exportHistory.create({
    data: {
      workspaceId,
      userId: auth.userId,
      templateName,
      destinationName,
      destinationIcon: destinationIcon ?? "📤",
      format,
      recordCount: recordCount ?? 0,
      fileSize: fileSize ?? "—",
      status,
    },
  });

  return NextResponse.json({ id: item.id, createdAt: item.createdAt.toISOString() }, { status: 201 });
}

// DELETE /api/export-history?workspaceId=... — clear history
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;
  if (access.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot clear export history" }, { status: 403 });
  }

  await prisma.exportHistory.deleteMany({ where: { workspaceId } });
  return new NextResponse(null, { status: 204 });
}
