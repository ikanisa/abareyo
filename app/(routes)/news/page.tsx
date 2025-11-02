import Image from "next/image";
import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";
import NewsClient from "./_components/NewsClient";
import { articles } from "./_data/articles";
import { highlights } from "./_data/highlights";

export const dynamic = "force-dynamic";

export const metadata = buildRouteMetadata("/news", {
  description: "Read Rayon Sports news, academy updates, and match analysis with highlight reels in one feed.",
});

const CATEGORY_COLORS: Record<(typeof articles)[number]["category"], string> = {
  "Club News": "from-sky-500/40 via-blue-500/40 to-indigo-500/40",
  Training: "from-emerald-500/40 via-lime-500/40 to-teal-500/40",
  Academy: "from-violet-500/40 via-fuchsia-500/40 to-rose-500/40",
  Community: "from-amber-500/40 via-orange-500/40 to-pink-500/40",
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type ArticleCardProps = {
  slug: string;
  title: string;
  summary: string;
  category: (typeof articles)[number]["category"];
  updatedAt: string;
};

const ArticleCard = ({ slug, title, summary, category, updatedAt }: ArticleCardProps) => {
  const updatedCopy = formatter.format(new Date(updatedAt));

  return (
    <Link
      href={`/news/${slug}`}
      className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-5 text-left transition hover:-translate-y-1 hover:border-white/30"
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-12 h-32 w-32 rounded-full blur-3xl ${CATEGORY_COLORS[category]}`}
      />
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden />
        {category}
      </span>
      <h2 className="mt-3 text-xl font-semibold text-white transition group-hover:text-white">{title}</h2>
      <p className="mt-2 text-sm text-white/75">{summary}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white/70">
        Updated {updatedCopy}
        <span aria-hidden className="transition group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
};

type HighlightCardProps = (typeof highlights)[number];

const HighlightCard = ({ slug, title, summary, duration, tags, poster }: HighlightCardProps) => (
  <Link
    href={`/news/highlights/${slug}`}
    className="group flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/10 transition hover:-translate-y-1 hover:border-white/30"
  >
    <div className="relative aspect-video overflow-hidden bg-black/30">
      {poster ? (
        <Image
          src={poster}
          alt={`${title} highlight poster`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-center transition group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-white/70">{duration}</div>
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-white">
        {duration}
      </span>
    </div>
    <div className="space-y-2 p-5 text-white">
      <h3 className="text-lg font-semibold text-white transition group-hover:text-white">{title}</h3>
      <p className="text-sm text-white/75">{summary}</p>
      <div className="flex flex-wrap gap-2 text-xs text-white/60">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/10 px-2 py-1 uppercase tracking-wide">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  </Link>
);

const NewsIndexPage = () => (
  <PageShell>
    <SubpageHeader
      title="Club Newsroom"
      eyebrow="Updates"
      description="Training ground briefs, academy spotlights, video highlights, and community features curated for Rayon Nation."
      backHref="/"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
          {articles.length} stories · {highlights.length} highlights
        </span>
      }
    />
    {highlights.length ? (
      <section className="space-y-4">
        <div className="rounded-3xl border border-white/15 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <p className="text-xs uppercase tracking-[0.26em] text-white/60">Featured highlight</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
            <HighlightCard {...highlights[0]} />
            <div className="space-y-3">
              <p className="text-sm text-white/70">
                Stream the latest behind-the-scenes footage directly in the app. Videos respect reduced-motion preferences and
                auto-captioned playback on the mobile client via Expo AV.
              </p>
              <div className="grid gap-3">
                {highlights.slice(1, 3).map((item) => (
                  <HighlightCard key={item.slug} {...item} />
                ))}
              </div>
              <Link
                href="/news/highlights"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/70 transition hover:border-white/40"
              >
                Browse highlight archive
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    ) : null}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.slug} {...article} />
      ))}
    </div>
    <NewsClient />
  </PageShell>
);

export default NewsIndexPage;
