import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

/** Leave your crew. Ownership passes to the earliest member; empty crews dissolve. */
export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const membership = await prisma.crewMember.findUnique({ where: { userId } });
  if (!membership) return NextResponse.json({ error: "You're not in a crew" }, { status: 404 });

  await prisma.crewMember.delete({ where: { id: membership.id } });

  const remaining = await prisma.crewMember.findFirst({
    where: { crewId: membership.crewId },
    orderBy: { joinedAt: "asc" },
  });
  if (!remaining) {
    await prisma.crew.delete({ where: { id: membership.crewId } }).catch(() => null);
  } else {
    const crew = await prisma.crew.findUnique({ where: { id: membership.crewId } });
    if (crew && crew.ownerId === userId) {
      await prisma.crew.update({ where: { id: crew.id }, data: { ownerId: remaining.userId } });
    }
  }
  return NextResponse.json({ ok: true });
}
