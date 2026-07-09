import { SettingsClient } from "@/components/SettingsClient";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getViewer();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your control center — profile, risk, theme, notifications and billing, all in one place.</p>
      </div>
      <SettingsClient isPro={viewer.isPro} />
    </div>
  );
}
