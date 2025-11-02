import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { mediaFeatures } from "../_data/videos";
import { buildRouteMetadata } from "@/app/_lib/navigation";

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

type MediaPageProps = {
  params: { slug: string };
};

const MediaFeaturePage = ({ params }: MediaPageProps) => {
  const feature = mediaFeatures.find((item) => item.slug === params.slug);
  if (!feature) {
    notFound();
  }

  return (
    <PageShell>
      <SubpageHeader
        title={feature.title}
        eyebrow={feature.category}
        description={feature.summary}
        backHref="/media"
        actions={
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
            {formatter.format(new Date(feature.publishedAt))}
          </span>
        }
      />
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-video w-full">
          <iframe
            src={`${feature.videoUrl}&title=0&byline=0&portrait=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={feature.title}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
      <section className="glass rounded-3xl border border-white/10 px-5 py-4 text-white">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Chapters</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {feature.chapters.map((chapter) => (
            <li
              key={chapter.label}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80"
            >
              <span className="font-semibold text-white">{chapter.timestamp}</span>
              <span className="ml-2 text-white/70">{chapter.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
};

export default MediaFeaturePage;

export async function generateMetadata({ params }: MediaPageProps): Promise<Metadata> {
  const feature = mediaFeatures.find((item) => item.slug === params.slug);

  if (!feature) {
    return buildRouteMetadata("/media", {
      title: "Media hub",
      description: "Watch highlights, behind-the-scenes content, and Rayon Sports interviews.",
    });
  }

  return buildRouteMetadata(`/media/${feature.slug}`, {
    title: `${feature.title} — Media hub`,
    description: feature.summary,
  });
}
