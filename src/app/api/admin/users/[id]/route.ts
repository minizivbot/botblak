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

/**
 * Admin: moderate a user — leaderboard visibility, grant/revoke the admin
 * panel, or grant/revoke a Pro plan.
 */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    showOnLeaderboard?: boolean;
    isAdmin?: boolean;
    plan?: "free" | "pro";
  } | null;
  if (!body || (body.showOnLeaderboard == null && body.isAdmin == null && body.plan == null)) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (typeof body.showOnLeaderboard === "boolean") {
    await prisma.settings.upsert({
      where: { userId: id },
      update: { showOnLeaderboard: body.showOnLeaderboard },
      create: { userId: id, showOnLeaderboard: body.showOnLeaderboard },
    });
  }

  if (typeof body.isAdmin === "boolean") {
    // Locking yourself out (or elevating the shared demo login) is never right.
    if (id === adminId) return NextResponse.json({ error: "You can't change your own admin access" }, { status: 400 });
    if (target.username === "demo") return NextResponse.json({ error: "The demo account can't be an admin" }, { status: 400 });
    await prisma.user.update({ where: { id }, data: { isAdmin: body.isAdmin } });
  }

  if (body.plan === "free" || body.plan === "pro") {
    // Admin grants don't expire; billing automation can set proUntil later.
    await prisma.user.update({ where: { id }, data: { plan: body.plan, proUntil: null } });
  }

  return NextResponse.json({ ok: true });
}
