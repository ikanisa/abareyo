"use client";

import useSWR from "swr";

export default function HighlightsRail({ matchId }: { matchId: string }) {
  const { data } = useSWR(`/api/media/highlights/${matchId}`, (url: string) => fetch(url).then((res) => res.json()));
  const items = data?.items ?? [];

  if (!items.length) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="section-title">Highlights</h2>
      <div className="grid gap-2">
        {items.map((video: { id: string; title: string }) => (
          <div key={video.id} className="tile">
            {video.title}
          </div>
        ))}
      </div>
    </section>
  );
}
