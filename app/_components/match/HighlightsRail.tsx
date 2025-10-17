'use client';

import useSWR from 'swr';

type HighlightItem = {
  id: string;
  title: string;
};

type HighlightResponse = {
  items: HighlightItem[];
};

const isHighlightItemArray = (value: unknown): value is HighlightItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      'id' in item &&
      'title' in item &&
      typeof (item as { id: unknown }).id === 'string' &&
      typeof (item as { title: unknown }).title === 'string',
  );

const fetchHighlights = async (url: string): Promise<HighlightItem[]> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) return [];
  const payload = (await response.json()) as unknown;

  if (
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    isHighlightItemArray((payload as HighlightResponse).items)
  ) {
    return (payload as HighlightResponse).items;
  }

  return [];
};

type HighlightsRailProps = {
  matchId: string;
};

export default function HighlightsRail({ matchId }: HighlightsRailProps) {
  const { data: highlights = [] } = useSWR<HighlightItem[]>(
    `/api/media/highlights/${matchId}`,
    fetchHighlights,
  );

  if (highlights.length === 0) return null;

  return (
    <section className="card">
      <h2 className="section-title">Highlights</h2>
      <div className="grid gap-2">
        {highlights.map((highlight) => (
          <div key={highlight.id} className="tile">
            {highlight.title}
          </div>
        ))}
      </div>
    </section>
  );
}
