import Link from "next/link";

import type { FeedItem } from "@/app/_config/home";

import { Skeleton } from "@/components/ui/skeleton";

import EmptyState from "../ui/EmptyState";

const skeletonItems = Array.from({ length: 3 }, (_, index) => index);

const typeLabels: Record<FeedItem["type"], string> = {
  news: "Club news",
  video: "Video",
  poll: "Fan poll",
  update: "Update",
};

const typeStyles: Record<FeedItem["type"], string> = {
  news: "bg-blue-500/15 text-blue-100",
  video: "bg-emerald-500/15 text-emerald-100",
  poll: "bg-violet-500/15 text-violet-100",
  update: "bg-white/10 text-white/80",
};

type FeedProps = {
  items: FeedItem[];
  isLoading: boolean;
  isOffline: boolean;
  onRetry?: () => void;
};

const Feed = ({ items, isLoading, isOffline, onRetry }: FeedProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
        {skeletonItems.map((item) => (
          <Skeleton key={`feed-skeleton-${item}`} className="h-36 rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    if (isOffline) {
      return (
        <EmptyState
          title="Offline mode"
          description="We&apos;ll refresh the latest club updates automatically once you reconnect."
          icon="📡"
          action={
            onRetry
              ? {
                  label: "Retry now",
                  onClick: onRetry,
                }
              : undefined
          }
        />
      );
    }

    return (
      <EmptyState
        title="No updates available"
        description="Match reports, polls and highlights will show up here once the media team publishes new items."
        icon="📰"
      />
    );
  }

  return (
    <div className="space-y-3">
      {isOffline ? (
        <div
          className="card border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80"
          role="status"
          aria-live="polite"
        >
          Offline mode — showing the most recently saved updates.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2" role="list">
        {items.map((item) => (
          <article key={item.id} className="card space-y-3 break-words whitespace-normal" role="listitem">
            <header className="space-y-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-wide ${typeStyles[item.type]}`}>
                {typeLabels[item.type]}
              </span>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            </header>
            <p className="text-sm text-white/70">{item.description}</p>
            <Link className="text-sm font-semibold text-white/80" href={item.href}>
              View details →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Feed;
