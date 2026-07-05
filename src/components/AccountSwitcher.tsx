"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AccountOption = { id: string; name: string; isCopy: boolean };

/**
 * Prominent account selector: All / Copy only / each account.
 * Drives the same ?account= URL param the pages filter by.
 */
export function AccountSwitcher({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("account") ?? "";
  // Copy accounts mirror each other, so they collapse into a single "Copy only"
  // group. Only non-copy accounts get their own chip.
  const copyAccounts = accounts.filter((a) => a.isCopy);
  const soloAccounts = accounts.filter((a) => !a.isCopy);
  const hasCopy = copyAccounts.length > 0;

  // Nothing to switch between: a single non-copy account and no copy group.
  if (soloAccounts.length <= 1 && !hasCopy) return null;

  const set = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("account", value);
    else next.delete("account");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const chip = (value: string, label: string, extra?: string) => (
    <button
      key={value || "all"}
      onClick={() => set(value)}
      className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
        active === value
          ? "border-accent/60 bg-accent/15 text-ink shadow-[0_0_16px_rgba(57,135,229,0.25)]"
          : "border-edge bg-surface text-ink-2 hover:border-edge-strong hover:text-ink"
      }`}
    >
      {label}
      {extra && <span className="ml-1.5 text-xs font-medium text-accent">{extra}</span>}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">Accounts</span>
      {chip("", "All")}
      {hasCopy && chip("copy", `Copy only${copyAccounts.length > 1 ? ` (${copyAccounts.length})` : ""}`)}
      {soloAccounts.map((a) => chip(a.id, a.name))}
    </div>
  );
}
