"use client";

import useSWR from "swr";

export default function RewardsWidget() {
  const { data } = useSWR("/api/rewards/summary", (url: string) => fetch(url).then((res) => res.json()));
  const points = data?.user?.points ?? 0;
  const perk = data?.latestPerk;

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-white/90">Rewards</div>
          <div className="muted text-xs">{points} pts</div>
        </div>
        <div className="flex gap-2">
          <a className="btn-primary" href={perk ? "/tickets" : "/shop"}>
            {perk ? "Redeem Ticket" : "Redeem in Shop"}
          </a>
          <a className="btn" href="/more/rewards">
            Details
          </a>
        </div>
      </div>
    </section>
  );
}
