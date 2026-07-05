/**
 * TradeZone mark: a gradient tile with two "zone" levels and a breakout
 * arrow punching through them — the ICT idea of price leaving the zone.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="logo-mark relative flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.62, height: size * 0.62 }}>
        {/* zone levels */}
        <path d="M3.5 9.5h17" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.6 2.2" />
        <path d="M3.5 15h17" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.6 2.2" />
        {/* breakout arrow */}
        <path d="M4.5 18.5l5-5.5 3.5 3L19 7.5" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 7h5v5" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
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
