import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { isProUser } from "@/lib/plan";
import { propTxnSchema, zodMessage } from "@/lib/validation";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const txns = await prisma.propTxn.findMany({ where: { userId }, orderBy: { date: "desc" } });
    return NextResponse.json({ txns });
  } catch (e) {
    console.error("GET /api/prop-txns failed:", e);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    if (!(await isProUser(userId))) {
      return NextResponse.json({ error: "The Prop Desk is a Pro feature." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = propTxnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }
    if (parsed.data.accountId) {
      const owns = await prisma.account.findFirst({ where: { id: parsed.data.accountId, userId } });
      if (!owns) return NextResponse.json({ error: "Unknown trading account" }, { status: 400 });
    }
    const txn = await prisma.propTxn.create({ data: { ...parsed.data, userId } });
    return NextResponse.json({ txn }, { status: 201 });
  } catch (e) {
    console.error("POST /api/prop-txns failed:", e);
    return NextResponse.json({ error: "Failed to save transaction" }, { status: 500 });
  }
}
