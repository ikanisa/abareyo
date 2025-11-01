import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import MediaClient from "./_components/MediaClient";
import { mediaFeatures } from "./_data/videos";
import { OptimizedImage } from "@/components/ui/optimized-image";

export const dynamic = "force-dynamic";

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const MediaIndexPage = () => (
  <PageShell>
    <SubpageHeader
      title="Media Hub"
      eyebrow="Video & Clips"
      description="Go behind the scenes with exclusive matchday footage, training ground access, and player interviews."
      backHref="/"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
          {mediaFeatures.length} videos
        </span>
      }
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {mediaFeatures.map((feature) => (
        <Link
          key={feature.slug}
          href={`/media/${feature.slug}`}
          className="group overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.3)] transition hover:-translate-y-1 hover:border-white/30"
          aria-label={`Watch ${feature.title}`}
        >
          <div className="relative h-48 w-full overflow-hidden">
            <OptimizedImage
              src={feature.poster}
              alt={`${feature.title} poster`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              ▶ {feature.duration}
            </span>
          </div>
          <div className="space-y-2 px-5 py-4 text-white">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden />
              {feature.category}
            </span>
            <h2 className="text-lg font-semibold transition group-hover:text-white">{feature.title}</h2>
            <p className="text-sm text-white/75">{feature.summary}</p>
            <span className="inline-flex items-center gap-2 text-xs text-white/60">
              {formatter.format(new Date(feature.publishedAt))}
              <span aria-hidden className="transition group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </Link>
      ))}
    </div>
    <MediaClient />
  </PageShell>
);

export default MediaIndexPage;
