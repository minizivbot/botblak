/**
 * TradeZone mark: a fused "TZ" monogram sharing one top bar — the left half
 * (white) drops into the T's stem, the right half (accent blue) continues
 * into the Z's diagonal and base — so the two letters read as one connected
 * glyph, not two icons side by side.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="logo-mark relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.6, height: size * 0.6 }}>
        <path d="M5 7H12M8 7V17" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 7H19L10 17H19" stroke="#7dd3fc" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ size = 32, text = true }: { size?: number; text?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      {text && (
        <span className="text-lg leading-none font-extrabold tracking-tight">
          Trade<span className="text-accent">Zone</span>
        </span>
      )}
    </span>
  );
}
