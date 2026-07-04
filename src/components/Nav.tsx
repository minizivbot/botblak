"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M3 11l4-6 4 4 3-5 3 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16h14" strokeLinecap="round" />
    </svg>
  ),
  trades: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M6 4v12M6 4L3.5 6.5M6 4l2.5 2.5M14 16V4M14 16l-2.5-2.5M14 16l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M5 3h9a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" strokeLinecap="round" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 3v9M10 12l-3-3M10 12l3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.2 5.2l1.4 1.4M13.4 13.4l1.4 1.4M14.8 5.2l-1.4 1.4M6.6 13.4l-1.4 1.4" strokeLinecap="round" />
    </svg>
  ),
  motivation: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 2.5c1.5 2.5 4.5 4 4.5 8a4.5 4.5 0 01-9 0c0-1.8.8-3.2 1.8-4.6.5.9 1.2 1.5 1.2 1.5C8.5 5.5 9.4 4 10 2.5z" strokeLinejoin="round" />
    </svg>
  ),
};

const links = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/trades", label: "Trades", icon: "trades" },
  { href: "/journal", label: "Journal", icon: "journal" },
  { href: "/motivation", label: "Daily Motivation", icon: "motivation" },
  { href: "/import", label: "Import & Sync", icon: "import" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-profit-mark shadow-[0_2px_10px_rgba(57,135,229,0.4)]">
        <svg viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2" className="h-4 w-4">
          <path d="M3 13l4-5 3.5 3L17 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 4h4v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-base font-bold tracking-tight">TradeLog</span>
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login" || pathname === "/register") return null;

  const items = links.map((l) => {
    const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        onClick={() => setOpen(false)}
        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised/60 hover:text-ink"
        }`}
      >
        {active && <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />}
        <span className={active ? "text-accent" : "text-muted"}>{icons[l.icon]}</span>
        {l.label}
      </Link>
    );
  });

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-edge bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/"><Logo /></Link>
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-edge bg-surface/60 p-4 backdrop-blur md:flex">
        <Link href="/" className="mb-8 px-2 pt-1"><Logo /></Link>
        <nav className="space-y-1">{items}</nav>
        <div className="mt-auto space-y-2 px-3">
          <button onClick={signOut} className="text-xs text-muted transition-colors hover:text-ink-2">
            Sign out
          </button>
          <p className="text-xs text-muted">Private by default</p>
        </div>
      </aside>
    </>
  );
}
