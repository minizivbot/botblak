import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { zodMessage } from "@/lib/validation";
import { sendPushToAll } from "@/lib/push";

const schema = z.object({
  announcement: z.string().trim().max(280).nullish().transform((s) => s || null),
  announcementLevel: z.enum(["info", "warning", "success"]).optional(),
  registrationOpen: z.boolean().optional(),
  leaderboardEnabled: z.boolean().optional(),
});

/** Admin: update the site-wide config that affects every visitor. */
export async function PUT(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const before = await prisma.siteConfig.findUnique({ where: { id: "singleton" } });
  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  // Only notify on a genuinely new/changed announcement, not every site-config save.
  if (config.announcement && config.announcement !== before?.announcement) {
    await sendPushToAll({ title: "📢 TradeZone", body: config.announcement, url: "/" });
  }

  return NextResponse.json({ config });
}
