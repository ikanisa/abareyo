import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";

import { MembersDirectoryClient } from "./_components/MembersDirectoryClient";

export const dynamic = "force-dynamic";

const MembersPage = () => (
  <PageShell>
    <SubpageHeader
      eyebrow="Community"
      title="Members directory"
      description="Opt into visibility, discover fellow volunteers, and connect with captains across Rayon Nation."
      backHref="/more"
      actions={<span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/70">Live roster sync</span>}
    />
    <MembersDirectoryClient />
  </PageShell>
);

export default MembersPage;
