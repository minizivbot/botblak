import { prisma } from "@/lib/prisma";
import { parseFilters, filtersToWhere } from "@/lib/filters";
import { toTradeDTO } from "@/lib/dto";
import { FilterBar } from "@/components/FilterBar";
import { TradesClient } from "@/components/TradesClient";

export const dynamic = "force-dynamic";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);

  const [trades, settings, symbolRows, strategyRows] = await Promise.all([
    prisma.trade.findMany({ where: filtersToWhere(filters), orderBy: { entryDate: "desc" } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.trade.findMany({ distinct: ["symbol"], select: { symbol: true }, orderBy: { symbol: "asc" } }),
    prisma.trade.findMany({ distinct: ["strategy"], select: { strategy: true }, where: { strategy: { not: null } } }),
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
