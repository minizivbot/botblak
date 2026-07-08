import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/siteconfig";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prop Firms" };

export default async function PropFirmsPage() {
  const site = await getSiteConfig();
  if (!site.propFirmsEnabled) redirect("/");

  const firms = await prisma.propFirm.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Prop firms</h1>
        <p className="mt-1 text-sm text-muted">
          Futures prop firms worth a look — connect any of them and track your challenge right here in TradeZone with
          the prop tracker (profit target + trailing drawdown).
        </p>
      </div>

      {firms.length === 0 ? (
        <div className="card text-sm text-muted">No firms listed yet.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {firms.map((f) => (
            <div key={f.id} className="card flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{f.emoji}</span>
                <h2 className="font-semibold">{f.name}</h2>
              </div>
              <p className="mt-2 flex-1 text-sm text-ink-2">{f.blurb}</p>
              {f.highlight && (
                <p className="mt-2 rounded-lg border border-profit/30 bg-profit/10 px-3 py-1.5 text-xs font-semibold text-profit">
                  {f.highlight}
                </p>
              )}
              {f.affiliateUrl ? (
                <a
                  href={f.affiliateUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="btn-primary mt-3 text-center text-sm"
                >
                  Visit {f.name} →
                </a>
              ) : (
                <span className="mt-3 rounded-lg border border-edge px-4 py-2 text-center text-sm text-muted">
                  Link coming soon
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        Some links are affiliate links — we may earn a commission at no extra cost to you. This isn&apos;t financial
        advice; always read a firm&apos;s rules before buying an evaluation.
      </p>
    </div>
  );
}
