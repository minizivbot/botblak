import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { DemoBanner } from "@/components/DemoBanner";
import { PlaybooksClient, type PlaybookStats } from "@/components/PlaybooksClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Playbooks — TradeZone" };

/**
 * Playbooks: each setup as a rule checklist, with proof of whether following
 * the checklist actually pays — the A+ setup vs. the rushed one.
 */
export default async function PlaybooksPage() {
  const { userId, isDemo } = await getViewer();
  if (!userId) redirect("/login");

  const [playbooks, tradesRaw] = await Promise.all([
    prisma.playbook.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.trade.findMany({ where: { userId, playbookId: { not: null } } }),
  ]);

  const closed = closedTrades(tradesRaw as StatsTrade[]) as (ReturnType<typeof closedTrades>[number] & {
    playbookId?: string | null;
    rulesHit?: string | null;
  })[];

  const stats: PlaybookStats[] = playbooks.map((p) => {
    const rules = (JSON.parse(p.rules) as string[]) ?? [];
    const mine = closed.filter((t) => t.playbookId === p.id);
    const wins = mine.filter((t) => t.pnl > 0).length;
    const pnl = mine.reduce((s, t) => s + t.pnl, 0);
    const hitCount = (t: (typeof mine)[number]) =>
      (t.rulesHit ?? "").split(",").filter((s) => s.trim() !== "").length;
    const full = mine.filter((t) => hitCount(t) >= rules.length);
    const partial = mine.filter((t) => hitCount(t) < rules.length);
    const avg = (arr: typeof mine) => (arr.length ? arr.reduce((s, t) => s + t.pnl, 0) / arr.length : null);
    return {
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      rules,
      trades: mine.length,
      winRate: mine.length ? wins / mine.length : null,
      pnl,
      fullCount: full.length,
      fullAvg: avg(full),
      partialCount: partial.length,
      partialAvg: avg(partial),
    };
  });

  return (
    <div className="space-y-4">
      {isDemo && <DemoBanner />}
      <div>
        <h1 className="text-xl font-semibold">Playbooks</h1>
        <p className="mt-1 text-sm text-muted">
          Turn every setup into a checklist. Tag trades with a playbook, tick the rules you followed — and see in
          numbers whether your A+ checklist actually pays.
        </p>
      </div>
      <PlaybooksClient stats={stats} readOnly={isDemo} />
    </div>
  );
}
