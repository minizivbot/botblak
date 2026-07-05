import { Logo } from "./Logo";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-page p-4">
      <div className="card w-full max-w-sm">
        <div className="mb-1">
          <Logo />
        </div>
        <p className="mb-5 text-sm text-muted">{title}</p>
        {children}
      </div>
    </div>
  );
}
