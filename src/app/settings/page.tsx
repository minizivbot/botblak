import { SettingsClient } from "@/components/SettingsClient";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getViewer();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsClient isPro={viewer.isPro} />
    </div>
  );
}
