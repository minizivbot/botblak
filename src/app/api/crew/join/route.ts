import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { sendPushToUser } from "@/lib/push";

const schema = z.object({
  code: z.string().trim().toUpperCase().min(4).max(12),
});

/** Join a crew by invite code. */
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const rl = rateLimit(`crewjoin:${userId}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: `Slow down — try again in ${rl.retryAfter}s` }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const existing = await prisma.crewMember.findUnique({ where: { userId } });
  if (existing) return NextResponse.json({ error: "You're already in a crew — leave it first" }, { status: 409 });

  const crew = await prisma.crew.findUnique({
    where: { code: parsed.data.code },
    include: { _count: { select: { members: true } } },
  });
  if (!crew) return NextResponse.json({ error: "No crew found with that code" }, { status: 404 });
  if (crew._count.members >= 20) return NextResponse.json({ error: "That crew is full (20 members max)" }, { status: 409 });

  await prisma.crewMember.create({ data: { crewId: crew.id, userId } });

  // Let the crew know someone new showed up (best-effort).
  try {
    const joiner = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const members = await prisma.crewMember.findMany({ where: { crewId: crew.id, NOT: { userId } }, select: { userId: true } });
    await Promise.all(
      members.map((m) =>
        sendPushToUser(m.userId, {
          title: `👥 ${joiner?.username ?? "Someone"} joined ${crew.name}`,
          body: "The crew just got bigger. Check who's green today.",
          url: "/crew",
        }),
      ),
    );
  } catch (e) {
    console.error("crew join notify failed:", e);
  }

  return NextResponse.json({ crew: { id: crew.id, name: crew.name } });
}
