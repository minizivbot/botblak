import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/brandmark";

export const runtime = "edge";
export const alt = "TradeZone — Trading Journal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social-share card rendered at request time. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0e14 0%, #0d1420 55%, #0a1a14 100%)",
          color: "#e8eef5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          <BrandMark size={96} />
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>
            <span>Trade</span>
            <span style={{ color: "#4a94ec" }}>Zone</span>
          </div>
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.2, maxWidth: 900 }}>
          Log trades, sync your broker, and see exactly where your edge is.
        </div>
        <div style={{ fontSize: 28, color: "#8a97a8", marginTop: 28 }}>
          ICT killzones · smart insights · daily-loss risk guard
        </div>
      </div>
    ),
    size,
  );
}
