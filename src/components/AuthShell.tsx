import Link from "next/link";
import { Logo } from "./Logo";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-page p-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <div className="mb-1">
            <Logo />
          </div>
          <p className="mb-5 text-sm text-muted">{title}</p>
          {children}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          By continuing you agree to our{" "}
          <Link href="/terms" className="hover:text-ink-2 hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="hover:text-ink-2 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
