'use client'
import useSWR from 'swr';

type LegacyFeedItem = { id?: string; title?: string; text?: string };

type FeedProps = {
  items?: LegacyFeedItem[];
  isLoading?: boolean;
  isOffline?: boolean;
  onRetry?: () => void;
};

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function Feed({ items: legacyItems, isLoading, isOffline }: FeedProps = {}){
  const shouldFetch = !legacyItems;
  const { data } = useSWR(shouldFetch ? '/api/feed' : null, fetcher);
  const items = legacyItems ?? data?.items ?? [];
  const loading = typeof isLoading === 'boolean' ? isLoading : shouldFetch && !data;
  if (loading) return null;
  if ((!legacyItems && isOffline) || !items.length) return null;
  return (
    <section className="grid gap-2">
      {items.map((entry, index) => (
        <div key={entry.id ?? `${entry.title ?? entry.text ?? 'item'}-${index}`} className="card">
          {entry.title ?? entry.text ?? 'Update'}
        </div>
      ))}
    </section>
  );
}
