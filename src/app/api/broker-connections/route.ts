import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { brokers, getBroker, BrokerError, type BrokerCredentials } from "@/lib/brokers";
import { encryptJson } from "@/lib/secretbox";

/** Connection status + credential field definitions for every broker. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const connections = await prisma.brokerConnection.findMany({
    where: { userId },
    select: { broker: true, updatedAt: true },
  });
  const connected = new Map(connections.map((c) => [c.broker, c.updatedAt]));

  return NextResponse.json({
    brokers: Object.values(brokers).map((b) => ({
      id: b.id,
      label: b.label,
      fields: b.credentialFields,
      connected: connected.has(b.id),
      connectedAt: connected.get(b.id) ?? null,
      envFallback: b.envConfigured(),
    })),
  });
}

/** Save (verify first!) the user's credentials for a broker. */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      broker?: string;
      credentials?: Record<string, unknown>;
    } | null;
    const adapter = body?.broker ? getBroker(body.broker) : undefined;
    if (!adapter) return NextResponse.json({ error: "Unknown broker" }, { status: 400 });

    const creds: BrokerCredentials = {};
    for (const field of adapter.credentialFields) {
      const v = body?.credentials?.[field.key];
      if (typeof v === "string" && v.trim()) creds[field.key] = v.trim();
      else if (!field.optional) {
        return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
      }
    }

    // Verify against the broker's API before saving anything.
    await adapter.verify(creds);

    await prisma.brokerConnection.upsert({
      where: { userId_broker: { userId, broker: adapter.id } },
      update: { credentials: encryptJson(creds) },
      create: { userId, broker: adapter.id, credentials: encryptJson(creds) },
    });
    return NextResponse.json({ ok: true, broker: adapter.id });
  } catch (e) {
    if (e instanceof BrokerError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("POST /api/broker-connections failed:", e);
    return NextResponse.json({ error: "Failed to save the connection" }, { status: 500 });
  }
}

/** Disconnect a broker (deletes the stored credentials). */
export async function DELETE(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const broker = req.nextUrl.searchParams.get("broker");
  if (!broker) return NextResponse.json({ error: "broker query param required" }, { status: 400 });

  await prisma.brokerConnection
    .delete({ where: { userId_broker: { userId, broker } } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
