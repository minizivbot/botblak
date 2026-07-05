const STYLES: Record<string, string> = {
  info: "bg-accent/15 text-ink border-accent/30",
  warning: "bg-yellow-500/15 text-yellow-200 border-yellow-600/40",
  success: "bg-profit/15 text-profit border-profit/30",
};

/** Site-wide banner set by an admin; rendered above everything for all users. */
export function AnnouncementBar({ text, level }: { text: string; level: string }) {
  return (
    <div className={`border-b px-4 py-2 text-center text-sm font-medium ${STYLES[level] ?? STYLES.info}`}>
      {text}
    </div>
  );
}
