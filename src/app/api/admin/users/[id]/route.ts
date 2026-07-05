import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: delete a user (and all their data via cascade). */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await ctx.params;
  if (id === adminId) return NextResponse.json({ error: "You can't delete your own account here" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.username === "demo") return NextResponse.json({ error: "The demo account is protected" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

/** Admin: hide/show a user on the leaderboard (light moderation). */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { showOnLeaderboard?: boolean } | null;
  if (typeof body?.showOnLeaderboard !== "boolean") {
    return NextResponse.json({ error: "showOnLeaderboard (boolean) required" }, { status: 400 });
  }
  await prisma.settings.upsert({
    where: { userId: id },
    update: { showOnLeaderboard: body.showOnLeaderboard },
    create: { userId: id, showOnLeaderboard: body.showOnLeaderboard },
  });
  return NextResponse.json({ ok: true });
}
