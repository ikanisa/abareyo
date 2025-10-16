"use client";

import useSWR from "swr";

export default function LiveTicker({ id }: { id: string }) {
  const { data } = useSWR(`/api/live/match/${id}`, (url: string) => fetch(url).then((res) => res.json()));
  const latest = data?.timeline?.[0]?.text ?? "—";

  return (
    <div className="tile">
      <div className="muted text-xs">Live</div>
      <div>{latest}</div>
    </div>
  );
}
