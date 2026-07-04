"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard", icon: "◫" },
  { href: "/trades", label: "Trades", icon: "⇅" },
  { href: "/journal", label: "Journal", icon: "✎" },
  { href: "/import", label: "Import & Sync", icon: "⇪" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = links.map((l) => {
    const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised/60 hover:text-ink"
        }`}
      >
        <span aria-hidden className="w-4 text-center text-muted">
          {l.icon}
        </span>
        {l.label}
      </Link>
    );
  });

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-edge bg-surface px-4 py-3 md:hidden">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Trading Journal
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="rounded-lg border border-edge px-3 py-1.5 text-sm text-ink-2"
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open && (
        <nav className="space-y-1 border-b border-edge bg-surface p-3 md:hidden">{items}</nav>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-edge bg-surface p-4 md:flex">
        <Link href="/" className="mb-6 px-3 text-lg font-semibold tracking-tight">
          Trading Journal
        </Link>
        <nav className="space-y-1">{items}</nav>
        <p className="mt-auto px-3 text-xs text-muted">Local SQLite · dark mode</p>
      </aside>
    </>
  );
}
