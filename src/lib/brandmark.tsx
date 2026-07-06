/**
 * The TradeZone mark rendered as plain SVG (no emoji) so it matches the real
 * app logo pixel-for-pixel inside Satori-generated share/OG images — emoji
 * glyphs render inconsistently (or as a blank box) across Satori's font set.
 */
export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: "linear-gradient(135deg, #3987e5, #2f6fd0 55%, #199e70)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24" fill="none">
        <path d="M4 15h6" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2.4 2.2" />
        <path d="M4.5 18.5L17.5 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M12 7h5.5v5.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
