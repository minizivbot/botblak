"use client";

/** Opens the browser's print dialog — "Save as PDF" turns the report into a file. */
export function PrintReportButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary no-print flex items-center gap-2 text-sm">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
        <path d="M6 7V3.5h8V7M6 13h8v3.5H6V13z" strokeLinejoin="round" />
        <path d="M4.5 13H4a1 1 0 01-1-1V8a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1h-.5" strokeLinecap="round" />
      </svg>
      Export PDF
    </button>
  );
}
