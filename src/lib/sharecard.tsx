import { ImageResponse } from "next/og";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://tradingjanrel.vercel.app").replace(/^https?:\/\//, "");

type Stat = { label: string; value: string; tone?: "profit" | "loss" | "ink" };

/**
 * A branded 1200x630 share card (Twitter/Discord-friendly). Big headline + a
 * row of stats, TradeZone logo, and the site URL so viewers know where it's from.
 */
export function shareCard(opts: {
  eyebrow: string;
  headline: string;
  headlineTone: "profit" | "loss" | "ink";
  stats: Stat[];
  footnote?: string;
}) {
  const toneColor = (t?: string) => (t === "profit" ? "#22c55e" : t === "loss" ? "#ef4444" : "#e8eef5");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          background: "linear-gradient(135deg, #0a0e14 0%, #0d1420 55%, #0a1a14 100%)",
          color: "#e8eef5",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #3987e5, #199e70)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
            }}
          >
            📈
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            <span>Trade</span>
            <span style={{ color: "#4a94ec" }}>Zone</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: "#8a97a8", fontWeight: 600 }}>{opts.eyebrow}</div>
          <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3, color: toneColor(opts.headlineTone), lineHeight: 1.05 }}>
            {opts.headline}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
          {opts.stats.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                border: "1px solid #1e2836",
                borderRadius: 18,
                padding: "20px 24px",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ fontSize: 24, color: "#8a97a8" }}>{s.label}</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: toneColor(s.tone) }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 36, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, color: "#8a97a8" }}>
          <span>{opts.footnote ?? "Track your edge"}</span>
          <span style={{ color: "#4a94ec", fontWeight: 700 }}>{SITE}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
