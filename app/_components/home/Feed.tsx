"use client";

import useSWR from "swr";

type FeedItem = { id: string; title: string };

type FeedProps = {
  items?: FeedItem[];
  isLoading?: boolean;
  isOffline?: boolean;
  onRetry?: () => void;
};

export default function Feed({ items: providedItems, isLoading, isOffline, onRetry }: FeedProps = {}) {
  const shouldFetch = typeof providedItems === "undefined";
  const { data } = useSWR(shouldFetch ? "/api/feed" : null, (url: string) => fetch(url).then((res) => res.json()));
  const items: FeedItem[] = providedItems ?? data?.items ?? [];

  if (isOffline) {
    return (
      <section className="card space-y-2">
        <div className="muted text-sm">You are offline. Latest stories will appear once reconnected.</div>
        {onRetry ? (
          <button className="btn w-full" type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </section>
    );
  }

  if (isLoading || (shouldFetch && !data)) {
    return (
      <section className="card space-y-2" aria-busy="true">
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
      </section>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <section className="grid gap-2">
      {items.map((item) => (
        <div key={item.id} className="card">
          {item.title}
        </div>
      ))}
    </section>
  );
}
