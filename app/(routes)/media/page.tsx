import PageShell from '@/app/_components/shell/PageShell';

import MediaClient from './_components/MediaClient';

export const dynamic = 'force-dynamic';

export default function Media() {
  return (
    <PageShell>
      <section className="card">
        <h1>Highlights & Clips</h1>
        <p className="muted">Goal clips and interviews (on-demand).</p>
      </section>
      <MediaClient />
    </PageShell>
  );
}
