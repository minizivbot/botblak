import { ImportClient } from "@/components/ImportClient";

export const metadata = { title: "Import & Sync" };

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import &amp; Sync</h1>
      <ImportClient />
    </div>
  );
}
