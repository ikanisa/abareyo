import Link from "next/link";

import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/news/offline", {
  title: "News offline mode",
  description: "Catch up on cached match reports and highlights even without a connection.",
});

const NewsOfflinePage = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6">
    <div className="card max-w-2xl space-y-6 text-white">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold">Stories ready for offline viewing</h1>
        <p className="text-sm text-white/80">
          The latest match reports, interviews, and highlight reels you opened recently stay available while offline. New
          updates will appear once you&apos;re connected again.
        </p>
      </div>
      <div className="grid gap-3 rounded-2xl bg-white/5 p-4 text-sm text-white/80 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-900/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">What stays cached</div>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-white/75">
            <li>Match previews and post-match breakdowns.</li>
            <li>Behind-the-scenes photo stories.</li>
            <li>Saved highlight videos for quick replays.</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-slate-900/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">When you reconnect</div>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-white/75">
            <li>Pull down to refresh the News feed for fresh coverage.</li>
            <li>Queued notifications will deliver new breaking stories.</li>
            <li>Tap the smart banner to open the native GIKUNDIRO app.</li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link href="/news" className="btn-primary inline-flex items-center justify-center gap-2">
          Return to news hub
          <span aria-hidden>→</span>
        </Link>
        <Link href="/" className="btn">
          Browse home
        </Link>
      </div>
    </div>
  </div>
);

export default NewsOfflinePage;
