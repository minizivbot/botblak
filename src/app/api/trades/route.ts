import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFilters, filtersToWhere } from "@/lib/filters";
import { tradeSchema, zodMessage } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const where = filtersToWhere(parseFilters(params));
    const trades = await prisma.trade.findMany({ where, orderBy: { entryDate: "desc" } });
    return NextResponse.json({ trades });
  } catch (e) {
    console.error("GET /api/trades failed:", e);
    return NextResponse.json({ error: "Failed to load trades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }
    const trade = await prisma.trade.create({ data: { ...parsed.data, source: "manual" } });
    return NextResponse.json({ trade }, { status: 201 });
  } catch (e) {
    console.error("POST /api/trades failed:", e);
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 });
  }
}
