import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { parseFilters, filtersToWhere } from "@/lib/filters";
import { toTradeDTO } from "@/lib/dto";
import { FilterBar } from "@/components/FilterBar";
import { TradesClient } from "@/components/TradesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trades" };

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const filters = parseFilters(await searchParams);

  const [trades, settings, symbolRows, strategyRows] = await Promise.all([
    prisma.trade.findMany({ where: { ...filtersToWhere(filters), userId }, orderBy: { entryDate: "desc" } }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.trade.findMany({ where: { userId }, distinct: ["symbol"], select: { symbol: true }, orderBy: { symbol: "asc" } }),
    prisma.trade.findMany({ where: { userId, strategy: { not: null } }, distinct: ["strategy"], select: { strategy: true } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Trades</h1>
      <FilterBar
        symbols={symbolRows.map((r) => r.symbol)}
        strategies={strategyRows.map((r) => r.strategy!).sort()}
      />
      <TradesClient trades={trades.map(toTradeDTO)} currency={settings?.currency ?? "USD"} />
    </div>
  );
}
