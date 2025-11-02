import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import { SettingsClient } from "./_components/SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = buildRouteMetadata("/settings", {
  description: "Manage preferences, privacy settings, and alerts for your Rayon Sports account.",
});

const SettingsPage = () => (
  <PageShell>
    <SubpageHeader
      eyebrow="Control center"
      title="Settings & privacy"
      description="Tune language, alerts, accessibility, and support preferences for a calmer Rayon Nation experience."
      backHref="/more"
      actions={<span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/70">Synced to all devices</span>}
    />
    <SettingsClient />
  </PageShell>
);

export default SettingsPage;
