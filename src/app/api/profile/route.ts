import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { usernameSchema, zodMessage } from "@/lib/validation";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true } });
  return NextResponse.json({ user });
}

/** Change the signed-in user's username (unique, case-preserved). */
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const parsed = usernameSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

    const taken = await prisma.user.findFirst({
      where: { username: parsed.data.username, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) return NextResponse.json({ error: "That username is already taken" }, { status: 409 });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username: parsed.data.username },
      select: { username: true },
    });
    return NextResponse.json({ user });
  } catch (e) {
    console.error("PUT /api/profile failed:", e);
    return NextResponse.json({ error: "Failed to update username" }, { status: 500 });
  }
}
