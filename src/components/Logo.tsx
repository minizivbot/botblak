/**
 * TradeZone mark: a single bold breakout arrow crossing one resistance
 * level, capped with a clean chevron — reads clearly from a 16px favicon
 * up to a full share-card logo.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="logo-mark relative flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.66, height: size * 0.66 }}>
        <path d="M4 15h6" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2.4 2.2" />
        <path d="M4.5 18.5L17.5 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M12 7h5.5v5.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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
