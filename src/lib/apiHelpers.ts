import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Returns the current session user ID, or a 401 response. */
export async function requireAuth(): Promise<
  { userId: string } | NextResponse
> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId };
}

/** Returns the user's role in the workspace, or a 403/404 response. */
export async function requireWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<{ role: string } | NextResponse> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) {
    return NextResponse.json(
      { error: "Workspace not found or access denied" },
      { status: 403 }
    );
  }
  return { role: member.role };
}

/** True if the value is a NextResponse (i.e., an error was returned). */
export function isErrorResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}
