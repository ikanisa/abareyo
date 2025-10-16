import PageShell from '@/app/_components/shell/PageShell';
import MembersListClient from './_components/MembersListClient';

export const dynamic = 'force-dynamic';

export default function MembersPage() {
  return (
    <PageShell>
      <section className="card space-y-3" aria-labelledby="members-title">
        <div>
          <h1 id="members-title" className="text-white">
            Fan Energy Directory
          </h1>
          <p className="muted text-sm">
            See who is live on WhatsApp, linked for MoMo perks, and carrying GIKUNDIRO vibes around the world.
          </p>
        </div>
      </section>
      <MembersListClient />
    </PageShell>
  );
}
