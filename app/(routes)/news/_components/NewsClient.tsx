'use client';
import type { FormEvent } from "react";

import { useCallback, useEffect, useMemo, useState } from 'react';

import useFlags from '@/app/_components/flags/useFlags';

type ContentItem = {
  id: string;
  kind: 'article' | 'video';
  title: string;
  slug: string | null;
  summary: string | null;
  media_url: string | null;
  tags: string[] | null;
  published_at: string | null;
};

const filters: Array<{ label: string; value: 'all' | 'article' | 'video' }> = [
  { label: 'All', value: 'all' },
  { label: 'Articles', value: 'article' },
  { label: 'Videos', value: 'video' },
];

export default function NewsClient() {
  const flags = useFlags();
  const enabled = flags['features.curatedContent'];
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'article' | 'video'>('all');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [tag, setTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentCountLabel = useMemo(() => {
    if (!items.length) {
      return 'No stories yet';
    }
    return `${items.length} curated ${items.length === 1 ? 'story' : 'stories'}`;
  }, [items.length]);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set('q', query.trim());
      }
      if (kind !== 'all') {
        params.set('kind', kind);
      }
      if (tag) {
        params.set('tag', tag);
      }
      const url = params.toString() ? `/api/content?${params.toString()}` : '/api/content';
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load content');
      }
      const payload = await response.json();
      const received: ContentItem[] = payload.items ?? [];
      setItems(received);
      const tags = new Set<string>();
      for (const item of received) {
        item.tags?.forEach((entry) => tags.add(entry));
      }
      setAvailableTags(Array.from(tags).sort());
    } catch (err) {
      console.error(err);
      setError('Inkuru ntizabonetse.');
      setItems([]);
      setAvailableTags([]);
    } finally {
      setLoading(false);
    }
  }, [kind, query, tag]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetchContent();
  }, [enabled, fetchContent]);

  const handleSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void fetchContent();
    },
    [fetchContent],
  );

  if (!enabled) {
    return null;
  }

  return (
    <section className="space-y-4">
      <form className="card grid gap-3" onSubmit={handleSearch}>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              className={`rounded-full px-3 py-1 text-sm transition ${
                kind === filter.value ? 'bg-white text-black' : 'bg-black/30 text-white/70'
              }`}
              onClick={() => setKind(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
        {availableTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((entry) => {
              const isActive = tag === entry;
              return (
                <button
                  key={entry}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition ${
                    isActive
                      ? 'border-white/80 bg-white text-black'
                      : 'border-white/20 bg-black/30 text-white/60'
                  }`}
                  type="button"
                  onClick={() => setTag(isActive ? null : entry)}
                >
                  #{entry}
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-0 flex-1 rounded-2xl bg-black/20 px-3 py-2 text-sm"
            placeholder="Search articles, videos, or tags…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p className="text-xs uppercase tracking-wide text-white/50">{contentCountLabel}</p>
        {error && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
      </form>

      <div className="grid gap-3">
        {items.length === 0 && !loading && (
          <div className="card">No results just yet—add content in the CMS to populate this feed.</div>
        )}
        {items.map((item) => (
          <article key={item.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                {item.summary && <p className="text-sm text-white/70">{item.summary}</p>}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-white/50">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-black/30 px-2 py-1 uppercase">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="rounded-full bg-black/40 px-2 py-1 text-xs uppercase tracking-wide text-white/60">
                {item.kind}
              </span>
            </div>
            {item.media_url && (
              <a
                className="inline-flex items-center gap-2 text-sm text-sky-300 hover:text-sky-200"
                href={item.media_url}
                rel="noreferrer"
                target="_blank"
              >
                View media
              </a>
            )}
            <a
              className="text-sm text-white/80 underline"
              href={`/news/${item.slug ?? item.id}`}
            >
              Open detail
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
