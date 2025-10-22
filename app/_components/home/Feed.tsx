'use client';

import useSWR from 'swr';

import EmptyState from '@/app/_components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

type FeedItem = { id?: string; title?: string; text?: string; publishedAt?: string };

type FeedResponse = { items: FeedItem[] };

type FeedProps = {
  items?: FeedItem[];
  isLoading?: boolean;
  isOffline?: boolean;
  onRetry?: () => void;
};

const skeletonItems = Array.from({ length: 3 }, (_, index) => index);

const fetcher = async (url: string): Promise<FeedResponse> => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load feed (${response.status})`);
  }

  return (await response.json()) as FeedResponse;
};

export default function Feed({ items: legacyItems, isLoading, isOffline = false, onRetry }: FeedProps = {}) {
  const shouldFetch = !legacyItems;
  const { data, error, mutate, isValidating } = useSWR<FeedResponse>(
    shouldFetch ? '/api/feed' : null,
    fetcher,
    {
      revalidateOnFocus: !isOffline,
      revalidateOnReconnect: true,
    },
  );

  const items = legacyItems ?? data?.items ?? [];
  const loading = typeof isLoading === 'boolean' ? isLoading : shouldFetch && !data && !error;

  if (loading) {
    return (
      <div className="grid gap-2" role="status" aria-live="polite" aria-busy="true">
        {skeletonItems.map((item) => (
          <Skeleton key={`feed-skeleton-${item}`} className="h-20 rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  const handleRetry = () => {
    onRetry?.();
    if (shouldFetch) {
      void mutate();
    }
  };

  if ((isOffline || error) && items.length === 0) {
    const title = isOffline ? 'You\'re offline' : 'We couldn\'t refresh the feed';
    const description = isOffline
      ? 'Reconnect to sync the latest Rayon Sports updates. We\'ll retry automatically.'
      : 'Something interrupted the feed request. Try again in a few moments.';

    return (
      <EmptyState
        title={title}
        description={description}
        icon={isOffline ? '📡' : '⚠️'}
        action={onRetry || shouldFetch ? { label: 'Try again', onClick: handleRetry } : undefined}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No club news yet"
        description="Matchday stories, highlights, and behind-the-scenes updates will appear here once available."
        icon="📭"
        action={{ label: 'Visit community hub', href: '/community' }}
      />
    );
  }

  return (
    <section className="grid gap-2" role="feed" aria-busy={shouldFetch && isValidating}>
      {isOffline ? (
        <p
          data-testid="feed-offline-banner"
          className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-white/70"
          role="status"
          aria-live="polite"
        >
          You\'re viewing cached updates. New stories will sync once you reconnect.
        </p>
      ) : null}
      {items.map((entry, index) => {
        const id = entry.id ?? `${entry.title ?? entry.text ?? 'item'}-${index}`;
        const headline = entry.title ?? entry.text ?? 'Update';
        const subline = entry.title && entry.text ? entry.text : undefined;

        return (
          <article key={id} className="card space-y-1" role="article" aria-label={headline}>
            <h3 className="text-base font-semibold text-white">{headline}</h3>
            {subline ? <p className="text-sm text-white/70">{subline}</p> : null}
          </article>
        );
      })}
    </section>
  );
}
