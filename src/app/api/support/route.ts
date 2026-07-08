import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { sendPushToUser } from "@/lib/push";

const schema = z.object({
  body: z.string().trim().min(1, "Write a message first").max(2000, "Message is too long"),
});

/**
 * The signed-in user's support thread (marks admin replies as seen).
 * ?peek=1 returns only the unread count without marking anything seen,
 * so the widget's badge can poll without eating the notifications.
 */
export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (req.nextUrl.searchParams.has("peek")) {
    const unread = await prisma.supportMessage.count({
      where: { userId, fromAdmin: true, seenByUser: false },
    });
    return NextResponse.json({ unread });
  }

  const messages = await prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, fromAdmin: true, body: true, seenByUser: true, createdAt: true },
  });
  const unread = messages.filter((m) => m.fromAdmin && !m.seenByUser).length;
  if (unread > 0) {
    await prisma.supportMessage.updateMany({
      where: { userId, fromAdmin: true, seenByUser: false },
      data: { seenByUser: true },
    });
  }
  return NextResponse.json({ messages, unread });
}

/** Send a message to support. Admins get a push so they can reply quickly. */
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const rl = rateLimit(`support:${userId}`, 10, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: `Slow down — try again in ${rl.retryAfter}s` }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const message = await prisma.supportMessage.create({
    data: { userId, body: parsed.data.body, seenByUser: true },
  });

  // Nudge every DB-flagged admin. Never let notification issues fail the send.
  try {
    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
    await Promise.all(
      admins
        .filter((a) => a.id !== userId)
        .map((a) =>
          sendPushToUser(a.id, {
            title: "💬 New support message",
            body: `${sender?.username ?? "A user"}: ${parsed.data.body.slice(0, 100)}`,
            url: "/admin",
          }),
        ),
    );
  } catch (e) {
    console.error("support admin notify failed:", e);
  }

  return NextResponse.json({ message }, { status: 201 });
}
