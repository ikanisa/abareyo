'use client';

import { useCallback, useEffect, useState } from 'react';

import useFlags from '@/app/_components/flags/useFlags';

type MediaItem = {
  id: string;
  title: string;
  summary: string | null;
  media_url: string | null;
  published_at: string | null;
};

export default function MediaClient() {
  const flags = useFlags();
  const enabled = flags['features.media'];
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content?kind=video', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load media');
      }
      const payload = await response.json();
      setItems(payload.items ?? []);
    } catch (err) {
      console.error(err);
      setError('Ibiganiro ntibyabonetse.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void load();
  }, [enabled, load]);

  if (!enabled) {
    return null;
  }

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Latest clips</h2>
        {loading && <span className="text-xs text-white/60">Loading…</span>}
      </div>
      {error && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
      {items.length === 0 && !loading && <p className="muted text-sm">Upload a highlight to Supabase to see it here.</p>}
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-black/20 p-3">
            <div className="space-y-2">
              <div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                {item.summary && <p className="text-sm text-white/70">{item.summary}</p>}
              </div>
              {item.media_url && (
                <div className="aspect-video overflow-hidden rounded-2xl bg-black/40">
                  <iframe
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="h-full w-full"
                    src={item.media_url}
                    title={item.title}
                  />
                </div>
              )}
              {item.published_at && (
                <p className="text-xs uppercase tracking-wide text-white/40">
                  {new Date(item.published_at).toLocaleString()}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
