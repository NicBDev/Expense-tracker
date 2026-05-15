import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name?.trim() || null,
        passwordHash,
      },
    });

    // Create a default personal workspace for the new user
    const workspace = await prisma.workspace.create({
      data: {
        name: `${user.name ?? user.email.split("@")[0]}'s Workspace`,
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name, defaultWorkspaceId: workspace.id },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/register]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
