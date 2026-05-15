import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember, isErrorResponse } from "@/lib/apiHelpers";
import { addDays, addWeeks, addMonths, addQuarters } from "date-fns";

function nextRunDate(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case "daily":    return addDays(now, 1);
    case "weekly":   return addWeeks(now, 1);
    case "monthly":  return addMonths(now, 1);
    case "quarterly":return addQuarters(now, 1);
    default:         return addMonths(now, 1);
  }
}

// GET /api/schedules?workspaceId=...
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;

  const schedules = await prisma.scheduledExport.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(
    schedules.map((s) => ({
      id: s.id,
      templateId: s.templateId,
      destinationId: s.destinationId,
      format: s.format,
      frequency: s.frequency,
      nextRun: s.nextRun.toISOString(),
      active: s.active,
      createdAt: s.createdAt.toISOString(),
      createdBy: s.user.name ?? s.user.email,
    }))
  );
}

// POST /api/schedules
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { workspaceId, templateId, destinationId, format, frequency } = await req.json();
  if (!workspaceId || !templateId || !destinationId || !format || !frequency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const access = await requireWorkspaceMember(auth.userId, workspaceId);
  if (isErrorResponse(access)) return access;
  if (access.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot create schedules" }, { status: 403 });
  }

  const schedule = await prisma.scheduledExport.create({
    data: {
      workspaceId,
      userId: auth.userId,
      templateId,
      destinationId,
      format,
      frequency,
      nextRun: nextRunDate(frequency),
    },
  });

  return NextResponse.json(
    {
      id: schedule.id,
      templateId: schedule.templateId,
      destinationId: schedule.destinationId,
      format: schedule.format,
      frequency: schedule.frequency,
      nextRun: schedule.nextRun.toISOString(),
      active: schedule.active,
    },
    { status: 201 }
  );
}

// PATCH /api/schedules?id=... — toggle active
export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const schedule = await prisma.scheduledExport.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  const access = await requireWorkspaceMember(auth.userId, schedule.workspaceId);
  if (isErrorResponse(access)) return access;

  const { active } = await req.json();
  const updated = await prisma.scheduledExport.update({
    where: { id },
    data: { active: Boolean(active) },
  });

  return NextResponse.json({ id: updated.id, active: updated.active });
}

// DELETE /api/schedules?id=...
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const schedule = await prisma.scheduledExport.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  if (schedule.userId !== auth.userId) {
    const access = await requireWorkspaceMember(auth.userId, schedule.workspaceId);
    if (isErrorResponse(access) || access.role !== "owner") {
      return NextResponse.json({ error: "Cannot delete this schedule" }, { status: 403 });
    }
  }

  await prisma.scheduledExport.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
