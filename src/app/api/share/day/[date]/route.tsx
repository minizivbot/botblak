import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { fmtSignedMoney } from "@/lib/format";
import { SITE_HOST as SITE } from "@/lib/site";
import { BrandMark } from "@/lib/brandmark";

/**
 * A branded, invested share image of ONE trading day's P&L: the day's net,
 * headline stats, and a per-trade breakdown (symbol · direction · account →
 * P&L). Owner only. Rendered at 1200x630 for Twitter/Discord.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  const userId = await requireUserId();
  if (!userId) return new Response("Not signed in", { status: 401 });

  const { date } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Bad date", { status: 400 });

  const [tradesRaw, accounts, settings] = await Promise.all([
    prisma.trade.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId }, select: { id: true, name: true } }),
    prisma.settings.findUnique({ where: { userId } }),
  ]);
  const currency = settings?.currency ?? "USD";
  const nameOf = new Map(accounts.map((a) => [a.id, a.name]));

  // Match the calendar's keying: UTC close date.
  const dayTrades = closedTrades(tradesRaw as StatsTrade[])
    .filter((t) => t.closedAt.toISOString().slice(0, 10) === date)
    .map((t) => ({ ...t, accountId: (t as { accountId?: string | null }).accountId ?? null }))
    .sort((a, b) => b.pnl - a.pnl);

  const total = dayTrades.reduce((s, t) => s + t.pnl, 0);
  // The day's R:R — average when there's more than one trade, otherwise the
  // single trade's R:R. Trades without an R:R value are ignored.
  const rrVals = dayTrades.map((t) => (t as { rr?: number | null }).rr).filter((v): v is number => v != null);
  const dayRR = rrVals.length ? rrVals.reduce((s, v) => s + v, 0) / rrVals.length : null;
  // How many accounts placed at least one trade today (null = unassigned bucket).
  const accountsTraded = new Set(dayTrades.map((t) => t.accountId ?? "none")).size;

  const green = "#22c55e";
  const red = "#ef4444";
  const muted = "#8a97a8";
  const ink = "#e8eef5";
  const tone = total > 0 ? green : total < 0 ? red : ink;

  const dateLabel = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  // Show up to 7 trades in the card; summarize the rest.
  const shown = dayTrades.slice(0, 7);
  const rest = dayTrades.length - shown.length;

  // Headline must stay on one line — scale the font to its length.
  const headStr = dayTrades.length ? fmtSignedMoney(total, currency) : "No trades";
  const headSize = headStr.length <= 8 ? 96 : headStr.length <= 11 ? 78 : headStr.length <= 14 ? 62 : 52;

  const stats = [
    { label: accountsTraded === 1 ? "Account" : "Accounts", value: String(accountsTraded), color: ink },
    {
      label: rrVals.length > 1 ? "Avg R:R" : "R:R",
      value: dayRR == null ? "—" : `${dayRR.toFixed(2)}R`,
      color: dayRR != null ? green : ink,
    },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px",
          background: "linear-gradient(135deg, #0a0e14 0%, #0d1420 55%, #0a1a14 100%)",
          color: ink,
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandMark size={52} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>
            <span>Trade</span>
            <span style={{ color: "#4a94ec" }}>Zone</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 24, color: muted, fontWeight: 600 }}>Daily P&L</div>
        </div>

        <div style={{ display: "flex", gap: 40, marginTop: 30, flex: 1 }}>
          {/* Left: headline */}
          <div style={{ display: "flex", flexDirection: "column", width: 430 }}>
            <div style={{ fontSize: 26, color: muted, fontWeight: 600 }}>{dateLabel}</div>
            <div style={{ fontSize: headSize, fontWeight: 800, letterSpacing: -3, color: tone, lineHeight: 1.02, marginTop: 6, whiteSpace: "nowrap" }}>
              {headStr}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
              {stats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    border: "1px solid #1e2836",
                    borderRadius: 16,
                    padding: "16px 18px",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ fontSize: 19, color: muted }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, whiteSpace: "nowrap" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: per-trade breakdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              border: "1px solid #1e2836",
              borderRadius: 20,
              padding: "22px 26px",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ fontSize: 20, color: muted, fontWeight: 600, marginBottom: 8 }}>
              {dayTrades.length ? "Trades" : "Nothing logged this day"}
            </div>
            {shown.map((t, i) => {
              const acct = t.accountId ? nameOf.get(t.accountId) : null;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: i < shown.length - 1 ? "1px solid #161f2b" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 16,
                        fontWeight: 700,
                        color: t.direction === "LONG" ? green : red,
                        border: `1px solid ${t.direction === "LONG" ? green : red}55`,
                        borderRadius: 8,
                        padding: "2px 8px",
                      }}
                    >
                      {t.direction === "LONG" ? "L" : "S"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 26, fontWeight: 700 }}>{t.symbol}</div>
                      {acct && <div style={{ fontSize: 15, color: muted }}>{acct}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: t.pnl >= 0 ? green : red }}>
                    {fmtSignedMoney(t.pnl, currency)}
                  </div>
                </div>
              );
            })}
            {rest > 0 && (
              <div style={{ fontSize: 18, color: muted, marginTop: 10 }}>+ {rest} more trade{rest === 1 ? "" : "s"}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: muted }}>
          <span>Track your edge</span>
          <span style={{ color: "#4a94ec", fontWeight: 700 }}>{SITE}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
