import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFilters, filtersToWhere } from "@/lib/filters";
import { tradeSchema, zodMessage } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const where = { ...filtersToWhere(parseFilters(params)), userId };
    const trades = await prisma.trade.findMany({ where, orderBy: { entryDate: "desc" } });
    return NextResponse.json({ trades });
  } catch (e) {
    console.error("GET /api/trades failed:", e);
    return NextResponse.json({ error: "Failed to load trades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }
    if (parsed.data.accountId) {
      const owns = await prisma.account.findFirst({ where: { id: parsed.data.accountId, userId } });
      if (!owns) return NextResponse.json({ error: "Unknown trading account" }, { status: 400 });
    }
    const trade = await prisma.trade.create({ data: { ...parsed.data, source: "manual", userId } });
    return NextResponse.json({ trade }, { status: 201 });
  } catch (e) {
    console.error("POST /api/trades failed:", e);
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 });
  }
}
