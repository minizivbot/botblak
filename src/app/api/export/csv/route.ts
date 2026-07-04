import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFilters, filtersToWhere } from "@/lib/filters";
import { tradePnl } from "@/lib/pnl";

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Download the (filtered) trade log as CSV. */
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const where = filtersToWhere(parseFilters(params));
    const trades = await prisma.trade.findMany({ where, orderBy: { entryDate: "asc" } });

    const header = [
      "symbol", "direction", "entry_price", "exit_price", "size", "fees",
      "entry_date", "exit_date", "strategy", "notes", "pnl", "source",
    ];
    const rows = trades.map((t) =>
      [
        t.symbol,
        t.direction,
        t.entryPrice,
        t.exitPrice ?? "",
        t.size,
        t.fees,
        t.entryDate.toISOString(),
        t.exitDate?.toISOString() ?? "",
        t.strategy ?? "",
        t.notes ?? "",
        tradePnl(t) ?? "",
        t.source,
      ].map(csvCell).join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="trades-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error("GET /api/export/csv failed:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
