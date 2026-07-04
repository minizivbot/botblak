type Props = {
  label: string;
  value: string;
  sub?: string;
  /** Colors the value by sign: positive = profit green, negative = loss red. */
  tone?: "positive" | "negative" | "neutral";
};

export function StatTile({ label, value, sub, tone = "neutral" }: Props) {
  const toneClass =
    tone === "positive" ? "text-profit" : tone === "negative" ? "text-loss" : "text-ink";
  return (
    <div className="card">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-2">{sub}</p>}
    </div>
  );
}
