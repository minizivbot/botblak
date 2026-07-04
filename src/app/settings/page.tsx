import { SettingsClient } from "@/components/SettingsClient";

export const metadata = { title: "Settings — Trading Journal" };

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsClient />
    </div>
  );
}
