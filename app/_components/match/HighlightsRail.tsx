'use client';

import useSWR from 'swr';

type Highlight = {
  id: string;
  title: string;
};

type HighlightResponse = {
  items: Highlight[];
};

export default function HighlightsRail({ matchId }: { matchId: string }) {
  const { data } = useSWR<HighlightResponse>(
    `/api/media/highlights/${matchId}`,
    (url) => fetch(url).then((response) => response.json()),
  );
  const items = data?.items ?? [];
  if (!items.length) return null;
  return (
    <section className="card">
      <h2 className="section-title">Highlights</h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.id} className="tile">
            {item.title}
          </div>
        ))}
      </div>
    </section>
  );
}
