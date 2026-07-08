import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema, zodMessage } from "@/lib/validation";
import { brokers } from "@/lib/brokers";
import { requireUserId } from "@/lib/auth";
import { isProUser } from "@/lib/plan";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const settings =
      (await prisma.settings.findUnique({ where: { userId } })) ??
      (await prisma.settings.create({ data: { userId } }));
    // Broker connection status only — credentials never leave the server.
    const connections = await prisma.brokerConnection.findMany({
      where: { userId },
      select: { broker: true },
    });
    const connected = new Set(connections.map((c) => c.broker));
    const brokerStatus = Object.values(brokers).map((b) => ({
      id: b.id,
      label: b.label,
      configured: connected.has(b.id) || b.envConfigured(),
    }));
    return NextResponse.json({ settings, brokers: brokerStatus });
  } catch (e) {
    console.error("GET /api/settings failed:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }
    const data = { ...parsed.data };
    // Themes are a Pro perk — silently keep the default for free accounts.
    if (data.accent && !(await isProUser(userId))) delete data.accent;
    const settings = await prisma.settings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("PUT /api/settings failed:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
