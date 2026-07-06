/**
 * TradeZone mark: a bold "Z" monogram (for Zone) with its top stroke sloped
 * upward for a subtle growth cue — one continuous stroke, no overlapping
 * segments, so it stays crisp from favicon size up to a share-card logo.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="logo-mark relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path
          d="M6 8L18 6L6 17H18"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
