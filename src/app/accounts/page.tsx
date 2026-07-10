import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { ensureDefaultAccount } from "@/lib/accounts";
import { computeStats, type StatsTrade } from "@/lib/stats";
import { propStatus } from "@/lib/prop";
import { fmtMoney, fmtSignedMoney, fmtPct } from "@/lib/format";
import { AccountsManager } from "@/components/AccountsManager";
import { PropDesk } from "@/components/PropDesk";
import { DemoBanner } from "@/components/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const { userId, isDemo, isPro } = await getViewer();
  if (!userId) redirect("/login");
  if (!isDemo) await ensureDefaultAccount(userId);

  const [accounts, settings, propTxns] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        trades: {
          select: { id: true, symbol: true, direction: true, entryPrice: true, exitPrice: true, size: true, fees: true, entryDate: true, exitDate: true, strategy: true },
        },
      },
    }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.propTxn.findMany({ where: { userId }, orderBy: { date: "desc" } }),
  ]);
  const currency = settings?.currency ?? "USD";

  const propAccounts = accounts.filter((a) => a.propStartBalance != null);
  const propTxnDTOs = propTxns.map((t) => ({
    id: t.id,
    firm: t.firm,
    kind: t.kind,
    amount: t.amount,
    note: t.note,
    accountId: t.accountId,
    date: t.date.toISOString(),
  }));

  const cards = accounts.map((a) => {
    const stats = computeStats(a.trades as StatsTrade[], a.propStartBalance ?? 0);
    const prop = a.propStartBalance != null ? propStatus(a, a.trades) : null;
    return { account: a, stats, prop };
  });

  const grandPnl = cards.reduce((s, c) => s + c.stats.totalPnl, 0);

  return (
    <div className="space-y-4">
      {isDemo && <DemoBanner />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Accounts</h1>
          <p className="mt-1 text-sm text-muted">
            Every trading account you track, with its own numbers. Tap one to filter the whole dashboard by it.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Across all accounts</p>
          <p className={`text-lg font-bold ${grandPnl >= 0 ? "text-profit" : "text-loss"}`}>
            {fmtSignedMoney(grandPnl, currency)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ account: a, stats, prop }) => (
          <Link
            key={a.id}
            href={`/?account=${a.id}`}
            className="card block transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{a.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {a.isCopy && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">copy</span>}
                  {a.propStartBalance != null && (
                    <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-medium text-muted">prop</span>
                  )}
                  {a.propFunded && <span className="rounded-full bg-profit/15 px-2 py-0.5 text-[10px] font-bold text-profit">FUNDED ✓</span>}
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${stats.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {fmtSignedMoney(stats.totalPnl, currency)}
                </p>
                <p className="text-xs text-muted">
                  {stats.closedCount} trades{stats.winRate != null && <> · {fmtPct(stats.winRate)} win</>}
                </p>
              </div>
            </div>

            {prop?.enabled && prop.target != null && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>Prop target</span>
                  <span>{fmtSignedMoney(prop.netProfit, currency)} / {fmtMoney(prop.target, currency)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
                  <div
                    className={`h-full rounded-full ${prop.targetReached ? "bg-profit" : prop.netProfit < 0 ? "bg-loss" : "bg-yellow-500"}`}
                    style={{ width: `${Math.max(0, Math.min(100, (prop.targetProgress ?? 0) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      <PropDesk
        isPro={isPro}
        currency={currency}
        txns={propTxnDTOs}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        propAccountCount={propAccounts.length}
        fundedCount={propAccounts.filter((a) => a.propFunded).length}
      />

      {isDemo ? (
        <p className="text-sm text-muted">
          <Link href="/register" className="text-accent hover:underline">Create a free account</Link> to add and manage
          your own trading accounts.
        </p>
      ) : (
        <AccountsManager />
      )}
    </div>
  );
}
