import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ensureDefaultAccount } from "@/lib/accounts";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { parseFilters, filtersToWhere, applyKillzoneFilter, accountWhere } from "@/lib/filters";
import { parseConcepts } from "@/lib/concepts";
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
  await ensureDefaultAccount(userId);

  const filters = parseFilters(await searchParams);
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isCopy: true },
  });

  const [tradesRaw, settings, user, symbolRows, strategyRows] = await Promise.all([
    prisma.trade.findMany({
      where: { ...filtersToWhere(filters), ...accountWhere(filters, accounts), userId },
      orderBy: { entryDate: "desc" },
      include: { account: { select: { name: true, isCopy: true } } },
    }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { concepts: true } }),
    prisma.trade.findMany({ where: { userId }, distinct: ["symbol"], select: { symbol: true }, orderBy: { symbol: "asc" } }),
    prisma.trade.findMany({ where: { userId, strategy: { not: null } }, distinct: ["strategy"], select: { strategy: true } }),
  ]);

  const trades = applyKillzoneFilter(tradesRaw, filters);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Trades</h1>
      <AccountSwitcher accounts={accounts} />
      <FilterBar
        symbols={symbolRows.map((r) => r.symbol)}
        strategies={strategyRows.map((r) => r.strategy!).sort()}
      />
      <TradesClient
        trades={trades.map(toTradeDTO)}
        currency={settings?.currency ?? "USD"}
        accounts={accounts}
        userConcepts={parseConcepts(user?.concepts)}
      />
    </div>
  );
}
