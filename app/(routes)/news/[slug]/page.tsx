import Link from "next/link";
import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { findContent } from "@/lib/content";
import { ff } from "@/lib/flags";
import type { ArticleBlock, Article } from "../_data/articles";
import { articles as staticArticles } from "../_data/articles";
import { OptimizedImage } from "@/components/ui/optimized-image";

export const dynamic = "force-dynamic";

const humanFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const renderStaticBlock = (block: ArticleBlock) => {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={block.content.slice(0, 24)} className="text-base leading-relaxed text-white/80">
          {block.content}
        </p>
      );
    case "quote":
      return (
        <figure
          key={block.content.slice(0, 24)}
          className="rounded-3xl border border-white/15 bg-white/5 p-5 text-white/85 shadow-inner"
        >
          <blockquote className="text-lg font-semibold italic">“{block.content}”</blockquote>
          {block.attribution ? (
            <figcaption className="mt-2 text-sm uppercase tracking-[0.24em] text-white/60">
              — {block.attribution}
            </figcaption>
          ) : null}
        </figure>
      );
    case "list":
      return block.ordered ? (
        <ol
          key={block.items.join("|").slice(0, 24)}
          className="list-decimal space-y-2 pl-6 text-base leading-relaxed text-white/80"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul
          key={block.items.join("|").slice(0, 24)}
          className="list-disc space-y-2 pl-6 text-base leading-relaxed text-white/80"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    default:
      return null;
  }
};

const renderDynamicBody = (body: string | null) => {
  if (!body) {
    return null;
  }
  return body.split(/\n\n+/).map((paragraph, index) => (
    <p key={index} className="text-base leading-relaxed text-white/80">
      {paragraph}
    </p>
  ));
};

const RelatedStories = ({ currentSlug }: { currentSlug: string }) => {
  const related = staticArticles.filter((article) => article.slug !== currentSlug).slice(0, 3);
  if (!related.length) return null;
  return (
    <aside className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">More stories</h3>
      <div className="grid gap-3">
        {related.map((item) => (
          <Link
            key={item.slug}
            href={`/news/${item.slug}`}
            className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:border-white/30 hover:text-white"
            aria-label={`Read ${item.title}`}
          >
            <span className="font-semibold text-white">{item.title}</span>
            <span className="mt-1 block text-xs text-white/60">{item.summary}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
};

const renderStaticArticle = (article: Article) => (
  <PageShell>
    <SubpageHeader
      title={article.title}
      eyebrow={article.category}
      description={article.summary}
      backHref="/news"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
          {humanFormatter.format(new Date(article.updatedAt))}
        </span>
      }
    />
    {article.heroImage ? (
      <div className="relative h-72 overflow-hidden rounded-3xl border border-white/10">
        <OptimizedImage
          src={article.heroImage}
          alt={`${article.title} feature`}
          fill
          sizes="(max-width: 768px) 100vw, 80vw"
          className="object-cover object-center"
        />
      </div>
    ) : null}
    <article className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)] lg:items-start">
      <div className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">By {article.author}</p>
        {article.body.map((block) => renderStaticBlock(block))}
      </div>
      <RelatedStories currentSlug={article.slug} />
    </article>
  </PageShell>
);

const renderDynamicArticle = (article: NonNullable<Awaited<ReturnType<typeof findContent>>>) => (
  <PageShell>
    <SubpageHeader
      title={article.title}
      eyebrow={article.kind === "video" ? "Video" : "Article"}
      description={article.summary ?? undefined}
      backHref="/news"
      actions={
        article.published_at ? (
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
            {humanFormatter.format(new Date(article.published_at))}
          </span>
        ) : null
      }
    />
    <article className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      {article.kind === "video" && article.media_url ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black/40">
          <iframe
            allow="autoplay; fullscreen"
            allowFullScreen
            className="h-full w-full"
            src={article.media_url}
            title={article.title ?? "Video"}
          />
        </div>
      ) : (
        <div className="space-y-4">{renderDynamicBody(article.body)}</div>
      )}
      {article.tags && article.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2 text-xs text-white/60">
          {article.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-white/10 px-3 py-1">
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
    <RelatedStories currentSlug={article.slug ?? article.id} />
  </PageShell>
);

export default async function NewsArticle({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const contentEnabled = ff("features.curatedContent", true);
  let dynamicArticle: Awaited<ReturnType<typeof findContent>> | null = null;

  if (contentEnabled) {
    try {
      dynamicArticle = await findContent(slug);
    } catch (error) {
      console.error("Failed to load curated content", error);
    }

    if (dynamicArticle) {
      return renderDynamicArticle(dynamicArticle);
    }
  }

  const staticArticle = staticArticles.find((entry) => entry.slug === slug);
  if (staticArticle) {
    return renderStaticArticle(staticArticle);
  }

  // If the feature flag is off, we should mirror the previous behaviour and 404.
  if (!contentEnabled) {
    notFound();
  }

  notFound();
}
