/**
 * The TradeZone mark rendered as plain SVG (no emoji) so it matches the real
 * app logo pixel-for-pixel inside Satori-generated share/OG images. The
 * "Z" monogram whose bottom stroke breaks into an uptrend arrow — same mark
 * used in Logo.tsx and the static favicon/PWA icons.
 */
export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: "linear-gradient(135deg, #3987e5, #2f6fd0 55%, #199e70)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 28% 20%, rgba(255,255,255,0.4), transparent 55%)",
        }}
      />
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" style={{ position: "relative" }}>
        <path d="M6 8L18 6L6 17H18" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
