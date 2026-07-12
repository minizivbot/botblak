import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { ensureDefaultAccount } from "@/lib/accounts";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { DemoBanner } from "@/components/DemoBanner";
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
  const { userId, isDemo } = await getViewer();
  if (!userId) redirect("/login");
  if (!isDemo) await ensureDefaultAccount(userId);

  const filters = parseFilters(await searchParams);
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isCopy: true },
  });

  const [tradesRaw, settings, user, symbolRows, strategyRows, playbooksRaw] = await Promise.all([
    prisma.trade.findMany({
      where: { ...filtersToWhere(filters), ...accountWhere(filters, accounts), userId },
      orderBy: { entryDate: "desc" },
      include: { account: { select: { name: true, isCopy: true } } },
    }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { concepts: true } }),
    prisma.trade.findMany({ where: { userId }, distinct: ["symbol"], select: { symbol: true }, orderBy: { symbol: "asc" } }),
    prisma.trade.findMany({ where: { userId, strategy: { not: null } }, distinct: ["strategy"], select: { strategy: true } }),
    prisma.playbook.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  const playbooks = playbooksRaw.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    rules: (JSON.parse(p.rules) as string[]) ?? [],
  }));

  const trades = applyKillzoneFilter(tradesRaw, filters);

  return (
    <div className="space-y-4">
      {isDemo && <DemoBanner />}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Trades</h1>
        <Link href="/import" className="btn-ghost text-xs">
          ⇪ Import & Sync
        </Link>
      </div>
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
        playbooks={playbooks}
        readOnly={isDemo}
      />
    </div>
  );
}
