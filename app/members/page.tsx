import PageShell from '@/app/_components/shell/PageShell';
import MembersListClient from './_components/MembersListClient';

export const dynamic = 'force-dynamic';

export default function MembersPage() {
  return (
    <PageShell>
      <section className="card space-y-3" aria-labelledby="members-title">
        <div>
          <h1 id="members-title" className="text-white">
            Member Directory
          </h1>
          <p className="muted text-sm">Explore visible GIKUNDIRO fans across regions.</p>
        </div>
      </section>
      <MembersListClient />
    </PageShell>
  );
}
