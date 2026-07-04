export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-page p-4">
      <div className="card w-full max-w-sm">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-profit-mark">
            <svg viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2" className="h-4 w-4">
              <path d="M3 13l4-5 3.5 3L17 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 4h4v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">TradeLog</span>
        </div>
        <p className="mb-5 text-sm text-muted">{title}</p>
        {children}
      </div>
    </div>
  );
}
