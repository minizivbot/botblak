/** Pro accent themes. Each overrides the CSS accent variables site-wide. */
export const ACCENTS: Record<string, { label: string; accent: string; deep: string }> = {
  gold: { label: "Gold", accent: "#e5b53a", deep: "#a87f16" },
  violet: { label: "Violet", accent: "#8b5cf6", deep: "#6027c9" },
  emerald: { label: "Emerald", accent: "#10b981", deep: "#047857" },
  rose: { label: "Rose", accent: "#f43f5e", deep: "#be123c" },
  ice: { label: "Ice", accent: "#22d3ee", deep: "#0e7490" },
};

export const DEFAULT_ACCENT = { label: "Classic Blue", accent: "#3987e5", deep: "#1c5cab" };

/** CSS-variable style object for a stored accent id (null → no override). */
export function accentStyle(accentId: string | null | undefined): React.CSSProperties | undefined {
  const a = accentId ? ACCENTS[accentId] : undefined;
  if (!a) return undefined;
  return { "--color-accent": a.accent, "--color-accent-deep": a.deep } as React.CSSProperties;
}
