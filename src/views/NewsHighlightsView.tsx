"use client";

import { useMemo } from "react";

import { highlights } from "@/app/(routes)/news/_data/highlights";

export default function NewsHighlightsView() {
  const featured = highlights[0];
  const secondary = useMemo(() => highlights.slice(1), []);

  if (!featured) {
    return (
      <div className="space-y-4 rounded-3xl bg-slate-950/70 p-8 text-white">
        <h2 className="text-xl font-semibold">No highlights yet</h2>
        <p className="text-sm text-white/70">
          Upload match recaps from the newsroom console to populate this feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950/70 p-8 text-white shadow-lg shadow-slate-900/20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Featured highlight</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{featured.title}</h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video
            key={featured.videoUrl}
            id="featured-highlight"
            controls
            loop
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-contain"
          >
            <source src={featured.videoUrl} type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
        </div>
        <p className="mt-4 text-sm text-white/70">{featured.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {featured.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide">
              #{tag}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const element = document.getElementById('featured-highlight') as HTMLVideoElement | null;
            if (element) {
              element.currentTime = 0;
              element.play().catch(() => undefined);
            }
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500"
        >
          Replay highlight
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {secondary.map((item) => (
          <article key={item.slug} className="rounded-3xl bg-slate-950/70 p-6 text-white shadow-md shadow-slate-900/15">
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-white/70">{item.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wide">
                  #{tag}
                </span>
              ))}
            </div>
            <a
              href={`/news/${item.slug}`}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition hover:border-white/40"
            >
              Open highlight
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
