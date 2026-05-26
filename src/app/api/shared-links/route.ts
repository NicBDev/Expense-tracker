import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember, isErrorResponse } from "@/lib/apiHelpers";
import { randomBytes } from "crypto";
import { addDays } from "date-fns";

// GET /api/shared-links?workspaceId=...
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  const links = await prisma.sharedLink.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(
    links.map((l) => ({
      id: l.id,
      label: l.label,
      token: l.token,
      url: `${process.env.NEXTAUTH_URL}/share/${l.token}`,
      expiresAt: l.expiresAt.toISOString(),
      views: l.views,
      active: l.active,
      createdAt: l.createdAt.toISOString(),
      createdBy: l.user.name ?? l.user.email,
    }))
  );
}

// POST /api/shared-links
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { workspaceId, label, expiryDays = 7 } = await req.json();
  if (!workspaceId || !label) {
    return NextResponse.json({ error: "workspaceId and label are required" }, { status: 400 });
  }

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;
  if (access.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot create shared links" }, { status: 403 });
  }

  const token = randomBytes(24).toString("base64url");
  const link = await prisma.sharedLink.create({
    data: {
      workspaceId,
      userId: auth.userId,
      label,
      token,
      expiresAt: addDays(new Date(), expiryDays),
    },
  });

  return NextResponse.json(
    {
      id: link.id,
      label: link.label,
      token: link.token,
      url: `${process.env.NEXTAUTH_URL}/share/${link.token}`,
      expiresAt: link.expiresAt.toISOString(),
      views: 0,
      active: true,
      createdAt: link.createdAt.toISOString(),
    },
    { status: 201 }
  );
}

// PATCH /api/shared-links?id=...&workspaceId=... — revoke a link
// Requires workspaceId as a query param so membership can be verified
// before revealing whether the link ID exists.
export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const workspaceId = searchParams.get("workspaceId");

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });

  // Verify workspace membership BEFORE fetching the link.
  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  // Fetch workspace-scoped — prevents cross-workspace ID enumeration.
  const link = await prisma.sharedLink.findUnique({ where: { id, workspaceId } });
  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  // Only creator or owner can revoke
  if (link.userId !== auth.userId && access.role !== "owner") {
    return NextResponse.json({ error: "Cannot revoke this link" }, { status: 403 });
  }

  const updated = await prisma.sharedLink.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ id: updated.id, active: updated.active });
}
