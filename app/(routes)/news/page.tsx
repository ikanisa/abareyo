import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import NewsClient from "./_components/NewsClient";
import { articles } from "./_data/articles";

export const dynamic = "force-dynamic";

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

const NewsIndexPage = () => (
  <PageShell>
    <SubpageHeader
      title="Club Newsroom"
      eyebrow="Updates"
      description="Training ground briefs, academy spotlights, and community highlights curated for Rayon Nation."
      backHref="/"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
          {articles.length} stories
        </span>
      }
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.slug} {...article} />
      ))}
    </div>
    <NewsClient />
  </PageShell>
);

export default NewsIndexPage;
