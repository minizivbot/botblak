import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin";
import { computeStats, type StatsTrade } from "@/lib/stats";
import { fmtSignedMoney } from "@/lib/format";
import { getSiteConfig } from "@/lib/siteconfig";
import { planIsPro } from "@/lib/plan";
import { AdminUserRow } from "@/components/AdminUserRow";
import { AdminSiteControls } from "@/components/AdminSiteControls";
import { AdminPropFirms } from "@/components/AdminPropFirms";
import { AdminSupport } from "@/components/AdminSupport";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");
  if (!(await isUserAdmin(userId))) redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      isAdmin: true,
      plan: true,
      proUntil: true,
      createdAt: true,
      settings: { select: { showOnLeaderboard: true } },
      _count: { select: { trades: true, accounts: true } },
      trades: { select: { id: true, symbol: true, direction: true, entryPrice: true, exitPrice: true, size: true, fees: true, entryDate: true, exitDate: true, strategy: true } },
    },
  });

  const site = await getSiteConfig();
  const totalTrades = users.reduce((s, u) => s + u._count.trades, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = users.filter((u) => u.createdAt > weekAgo).length;
  const rows = users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    isAdmin: u.isAdmin,
    isPro: planIsPro(u),
    createdAt: u.createdAt.toISOString().slice(0, 10),
    tradeCount: u._count.trades,
    accountCount: u._count.accounts,
    pnl: computeStats(u.trades as StatsTrade[], 0).totalPnl,
    onLeaderboard: u.settings?.showOnLeaderboard !== false,
    isSelf: u.id === userId,
  }));
  const proCount = rows.filter((r) => r.isPro).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Admin</h1>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">restricted</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="card">
          <p className="text-xs text-muted">Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">New (7 days)</p>
          <p className="text-2xl font-bold">{newThisWeek}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Pro users</p>
          <p className="text-2xl font-bold text-amber-400">{proCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Total trades</p>
          <p className="text-2xl font-bold">{totalTrades}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">On leaderboard</p>
          <p className="text-2xl font-bold">{rows.filter((r) => r.onLeaderboard).length}</p>
        </div>
      </div>

      <AdminSupport />

      <AdminSiteControls initial={site} />

      <AdminPropFirms />

      <h2 className="pt-2 text-base font-semibold">Users</h2>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">User</th>
              <th className="px-4 py-2.5 text-right font-medium">Net P&L</th>
              <th className="px-4 py-2.5 text-right font-medium">Trades</th>
              <th className="px-4 py-2.5 text-right font-medium">Joined</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <AdminUserRow key={r.id} row={r} pnlLabel={fmtSignedMoney(r.pnl, "USD")} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Admin access is granted by a verified email (<code className="text-ink-2">ADMIN_EMAILS</code>), a username
        (<code className="text-ink-2">ADMIN_USERNAMES</code>), or the account&apos;s database admin flag. Email is the
        most secure since it can&apos;t be changed in-app.
      </p>
    </div>
  );
}
