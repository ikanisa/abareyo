import Link from "next/link";

import { feedItems } from "@/app/_config/home";

import EmptyState from "../ui/EmptyState";

const typeLabels: Record<(typeof feedItems)[number]["type"], string> = {
  news: "Club news",
  video: "Video",
  poll: "Fan poll",
  update: "Update",
};

const typeStyles: Record<(typeof feedItems)[number]["type"], string> = {
  news: "bg-blue-500/15 text-blue-100",
  video: "bg-emerald-500/15 text-emerald-100",
  poll: "bg-violet-500/15 text-violet-100",
  update: "bg-white/10 text-white/80",
};

const Feed = () => {
  if (feedItems.length === 0) {
    return (
      <EmptyState
        title="No updates available"
        description="Match reports, polls and highlights will show up here once the media team publishes new items."
        icon="📰"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2" role="list">
      {feedItems.map((item) => (
        <article key={item.id} className="card break-words whitespace-normal space-y-3" role="listitem">
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
  );
};

export default Feed;
