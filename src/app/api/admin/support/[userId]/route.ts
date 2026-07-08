import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { zodMessage } from "@/lib/validation";
import { sendPushToUser } from "@/lib/push";

type Ctx = { params: Promise<{ userId: string }> };

const schema = z.object({
  body: z.string().trim().min(1, "Write a reply first").max(2000, "Reply is too long"),
});

/** Admin: one user's full support thread (marks their messages as read). */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { userId } = await ctx.params;
  const messages = await prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, fromAdmin: true, body: true, createdAt: true },
  });
  await prisma.supportMessage.updateMany({
    where: { userId, fromAdmin: false, seenByAdmin: false },
    data: { seenByAdmin: true },
  });
  return NextResponse.json({ messages });
}

/** Admin: reply in a user's support thread (pushes a notification to them). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { userId } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const message = await prisma.supportMessage.create({
    data: { userId, fromAdmin: true, body: parsed.data.body, seenByAdmin: true },
  });

  try {
    await sendPushToUser(userId, {
      title: "💬 TradeZone Support",
      body: parsed.data.body.slice(0, 120),
      url: "/",
    });
  } catch (e) {
    console.error("support reply notify failed:", e);
  }

  return NextResponse.json({ message }, { status: 201 });
}
