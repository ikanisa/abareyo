import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { highlights } from "../../_data/highlights";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const dynamic = "force-dynamic";

const publishedFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function HighlightDetail({ params }: { params: { slug: string } }) {
  const highlight = highlights.find((item) => item.slug === params.slug);

  if (!highlight) {
    notFound();
  }

  return (
    <PageShell>
      <SubpageHeader
        title={highlight.title}
        eyebrow="Video highlight"
        description={highlight.summary}
        backHref="/news"
        actions={
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
            {publishedFormatter.format(new Date(highlight.publishedAt))}
          </span>
        }
      />
      <article className="space-y-5 rounded-3xl border border-white/15 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black/30">
          <video
            className="h-full w-full"
            controls
            poster={highlight.poster}
            preload="metadata"
            aria-label={`${highlight.title} highlight`}
          >
            <source src={highlight.videoUrl} type="video/mp4" />
            Your browser does not support embedded videos.
          </video>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/70">
          {highlight.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-3 py-1 uppercase tracking-[0.24em]">
              #{tag}
            </span>
          ))}
        </div>
        <p className="text-sm text-white/80">
          Playback uses native HTML video on the web and Expo AV inside the mobile More tab so fans enjoy smooth controls and
          background audio support.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href="/news">
            Back to newsroom
          </Link>
          <Link className="btn-secondary" href="/rewards">
            Earn bonus points
          </Link>
        </div>
      </article>
    </PageShell>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const highlight = highlights.find((item) => item.slug === params.slug);

  if (!highlight) {
    return buildRouteMetadata("/news/highlights", {
      title: "Video highlight",
      description: "Watch Rayon Sports match highlights and supporter features.",
    });
  }

  return buildRouteMetadata(`/news/highlights/${highlight.slug}`, {
    title: `${highlight.title} — Video highlight`,
    description: highlight.summary,
  });
}
