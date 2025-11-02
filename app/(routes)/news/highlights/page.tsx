import Image from "next/image";
import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";
import { highlights } from "../_data/highlights";

export const dynamic = "force-dynamic";

export const metadata = buildRouteMetadata("/news/highlights", {
  description: "Watch Rayon Sports match highlights, behind-the-scenes clips, and community stories on demand.",
});

const HighlightsPage = () => (
  <PageShell>
    <SubpageHeader
      eyebrow="Highlights"
      title="Video archive"
      description="Relive behind-the-scenes stories, match build-up, and community features."
      backHref="/news"
      actions={<span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">{highlights.length} videos</span>}
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {highlights.map((item) => (
        <Link
          key={item.slug}
          href={`/news/highlights/${item.slug}`}
          className="group flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/5 transition hover:-translate-y-1 hover:border-white/30"
        >
          <div className="relative aspect-video overflow-hidden bg-black/30">
            {item.poster ? (
              <Image
                src={item.poster}
                alt={`${item.title} highlight poster`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition group-hover:scale-105"
              />
            ) : null}
            <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-white">
              {item.duration}
            </span>
          </div>
          <div className="space-y-2 p-5 text-white">
            <h3 className="text-lg font-semibold text-white transition group-hover:text-white">{item.title}</h3>
            <p className="text-sm text-white/75">{item.summary}</p>
            <div className="flex flex-wrap gap-2 text-xs text-white/60">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2 py-1 uppercase tracking-wide">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  </PageShell>
);

export default HighlightsPage;
