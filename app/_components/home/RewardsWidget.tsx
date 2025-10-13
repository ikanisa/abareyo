"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/integrations/supabase/client";

type LatestPerk =
  | { type: "free_ticket"; ticket_id: string; label: string }
  | { type: "points"; points: number; label: string };

type RewardsSummary = {
  user: { id: string; name: string | null; tier: string | null; points: number };
  latestPerk: LatestPerk | null;
};

type RewardsSummaryResponse = RewardsSummary | { error: string };

function Skeleton() {
  return (
    <div className="card break-words whitespace-normal" aria-busy="true" aria-label="Loading rewards">
      <div className="mb-2 h-5 w-32 animate-pulse rounded bg-white/10" />
      <div className="mb-3 h-4 w-20 animate-pulse rounded bg-white/10" />
      <div className="flex gap-2">
        <div className="h-11 w-32 animate-pulse rounded-xl bg-white/10" />
        <div className="h-11 w-28 animate-pulse rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function RewardsWidget({ userId }: { userId?: string }) {
  const [data, setData] = useState<RewardsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);

      try {
        const client = getSupabaseClient();
        if (!client) {
          setData(null);
          return;
        }

        const { data: sessionData } = await client.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          setData(null);
          return;
        }

        const url = userId ? `/api/rewards/summary?user_id=${encodeURIComponent(userId)}` : "/api/rewards/summary";
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error("Failed to load rewards summary");
        }
        const json = (await response.json()) as RewardsSummaryResponse;

        if (!cancelled) {
          if ("error" in json) {
            setData(null);
          } else {
            setData(json);
          }
        }
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [userId]);

  if (loading) {
    return <Skeleton />;
  }

  if (!data) {
    return (
      <div className="card break-words whitespace-normal" aria-live="polite">
        <div className="font-semibold text-white/90">Rewards</div>
        <div className="muted text-sm">No rewards info yet.</div>
      </div>
    );
  }

  const { user, latestPerk } = data;
  const redeemHref = latestPerk?.type === "free_ticket" ? "/tickets" : "/shop";
  const redeemLabel = latestPerk?.type === "free_ticket" ? "Redeem in Tickets" : "Redeem in Shop";

  return (
    <section className="card break-words whitespace-normal" aria-label="Rewards widget" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-white/90">Rewards</div>
          <div className="muted text-sm">Tier: {user.tier ?? "guest"}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-white/90" aria-label="Current points">
            {user.points} pts
          </div>
          <div className="muted text-xs">Current points</div>
        </div>
      </div>

      <div className="mt-3">
        {latestPerk ? (
          <div className="chip bg-white/15 text-xs font-semibold" aria-label="Latest perk">
            {latestPerk.label}
          </div>
        ) : (
          <div className="muted text-sm">No active perks — keep supporting to earn more.</div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a
          href={redeemHref}
          className="btn-primary inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold"
          aria-label={redeemLabel}
        >
          {redeemLabel}
        </a>
        <a
          href="/more"
          className="btn inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold"
          aria-label="View rewards details"
        >
          Details
        </a>
      </div>
    </section>
  );
}
