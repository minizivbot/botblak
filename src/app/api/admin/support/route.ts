import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** Admin: all support threads, newest activity first, with unread counts. */
export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const grouped = await prisma.supportMessage.groupBy({
    by: ["userId"],
    _max: { createdAt: true },
    _count: { _all: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, username: true, email: true },
  });
  const unreadRows = await prisma.supportMessage.groupBy({
    by: ["userId"],
    where: { fromAdmin: false, seenByAdmin: false },
    _count: { _all: true },
  });
  const lastMessages = await prisma.supportMessage.findMany({
    where: { userId: { in: grouped.map((g) => g.userId) } },
    orderBy: { createdAt: "desc" },
    distinct: ["userId"],
    select: { userId: true, body: true, fromAdmin: true, createdAt: true },
  });

  const byId = new Map(users.map((u) => [u.id, u]));
  const unread = new Map(unreadRows.map((r) => [r.userId, r._count._all]));
  const last = new Map(lastMessages.map((m) => [m.userId, m]));

  const threads = grouped
    .map((g) => ({
      userId: g.userId,
      username: byId.get(g.userId)?.username ?? "(deleted)",
      email: byId.get(g.userId)?.email ?? null,
      messageCount: g._count._all,
      unread: unread.get(g.userId) ?? 0,
      lastBody: last.get(g.userId)?.body ?? "",
      lastFromAdmin: last.get(g.userId)?.fromAdmin ?? false,
      lastAt: g._max.createdAt,
    }))
    .sort((a, b) => (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0));

  return NextResponse.json({ threads, totalUnread: unreadRows.reduce((s, r) => s + r._count._all, 0) });
}
