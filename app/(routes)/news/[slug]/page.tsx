import { notFound } from 'next/navigation';

import PageShell from '@/app/_components/shell/PageShell';
import { findContent } from '@/lib/content';
import { ff } from '@/lib/flags';

export const dynamic = 'force-dynamic';

type NewsArticleProps = {
  params: { slug: string };
};

function renderBody(body: string | null) {
  if (!body) {
    return null;
  }

  return body.split(/\n\n+/).map((paragraph, index) => (
    <p key={index} className="text-sm leading-relaxed text-white/80">
      {paragraph}
    </p>
  ));
}

export default async function NewsArticle({ params }: NewsArticleProps) {
  if (!ff('features.curatedContent', true)) {
    notFound();
  }

  const article = await findContent(params.slug);

  if (!article) {
    notFound();
  }

  const isVideo = article.kind === 'video';

  return (
    <PageShell>
      <article className="card space-y-4">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Rayon Sports Media</p>
          <h1 className="text-2xl font-semibold text-white">{article.title}</h1>
          {article.published_at && (
            <p className="text-xs text-white/50">{new Date(article.published_at).toLocaleString()}</p>
          )}
          {article.summary && <p className="text-sm text-white/70">{article.summary}</p>}
        </header>

        {isVideo && article.media_url ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black/40">
            <iframe
              allow="autoplay; fullscreen"
              allowFullScreen
              className="h-full w-full"
              src={article.media_url}
              title={article.title}
            />
          </div>
        ) : (
          <div className="space-y-4">{renderBody(article.body)}</div>
        )}

        {article.tags && article.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-xs text-white/60">
            {article.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-white/10 px-3 py-1">
                #{tag}
              </li>
            ))}
          </ul>
        )}

        <a className="text-sm text-sky-300 hover:text-sky-200" href="/news">
          ← Back to News &amp; Media
        </a>
      </article>
    </PageShell>
  );
}
