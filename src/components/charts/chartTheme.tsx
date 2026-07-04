"use client";

/** Shared chart tokens (dark surface #1a1a19, palette validated via dataviz checks). */
export const chart = {
  grid: "#262a31",
  axis: "#343943",
  tick: "#858b96",
  accent: "#3987e5",
  profit: "#199e70",
  loss: "#e66767", // marks keep the CVD-validated red; text uses the brighter --color-loss
};

export function fmtCompactMoney(v: number, currency = "USD"): string {
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}${sym}${(abs / 1000).toFixed(0)}K`;
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
}

export function TooltipCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-edge bg-raised px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-ink">{title}</p>
      {rows.map(([k, v]) => (
        <p key={k} className="text-ink-2">
          {k}: <span className="font-medium text-ink">{v}</span>
        </p>
      ))}
    </div>
  );
}
