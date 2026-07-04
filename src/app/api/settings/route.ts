import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema, zodMessage } from "@/lib/validation";
import { brokers } from "@/lib/brokers";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const settings =
      (await prisma.settings.findUnique({ where: { userId } })) ??
      (await prisma.settings.create({ data: { userId } }));
    // Broker key status only — the keys themselves never leave the server.
    const brokerStatus = Object.values(brokers).map((b) => ({
      id: b.id,
      label: b.label,
      configured: b.isConfigured(),
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
    const settings = await prisma.settings.upsert({
      where: { userId },
      update: parsed.data,
      create: { userId, ...parsed.data },
    });
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("PUT /api/settings failed:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
