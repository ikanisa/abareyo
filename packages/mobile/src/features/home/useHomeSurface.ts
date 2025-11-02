import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSupabase } from "@/api";
import { useNextMatch } from "@/features/tickets/useTicketCatalog";

export type HomeQuickAction = {
  id: string;
  label: string;
  href: string;
  metric?: string;
};

export type HomeStory = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type HomeSurface = {
  hero: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  };
  ticker: Array<{ id: string; minute: string; text: string }>;
  quickActions: HomeQuickAction[];
  stories: HomeStory[];
};

const FALLBACK_STORIES: HomeStory[] = [
  {
    id: "academy-promotion",
    title: "Academy graduates join first team",
    description: "Coach explains how the youth pipeline is feeding the senior squad.",
    href: "news/academy-promotion",
  },
  {
    id: "continental-night",
    title: "Continental nights return to Kigali",
    description: "All you need to know before the CAF Champions League qualifier.",
    href: "news/continental-night",
  },
];

export function useHomeSurface() {
  const supabase = useSupabase();
  const nextMatch = useNextMatch();

  const query = useQuery({
    queryKey: ["home-feed"],
    queryFn: async (): Promise<HomeStory[]> => {
      if (!supabase) {
        return FALLBACK_STORIES;
      }

      const { data, error } = await supabase
        .from("news_feed")
        .select("id, title, description, slug")
        .limit(5)
        .order("published_at", { ascending: false });

      if (error || !data?.length) {
        if (error) {
          console.warn("[home] Falling back to static stories", error.message);
        }
        return FALLBACK_STORIES;
      }

      return data.map((story) => ({
        id: story.id,
        title: story.title,
        description: story.description ?? "",
        href: `news/${story.slug}`,
      }));
    },
    initialData: FALLBACK_STORIES,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo((): HomeSurface => {
    return {
      hero: {
        title: `${nextMatch.opponent} • ${new Date(nextMatch.kickoff).toLocaleString()}`,
        subtitle: `${nextMatch.venue} — ${nextMatch.competition}`,
        ctaLabel: nextMatch.status === "soldout" ? "Match Centre" : "Buy Tickets",
        ctaHref: nextMatch.status === "soldout" ? `matches/${nextMatch.id}` : `tickets/${nextMatch.id}`,
      },
      ticker: [
        { id: "1", minute: "12", text: "Goal! Nziza converts a whipped cross." },
        { id: "2", minute: "43", text: "APR pressing high, Rayon happy to counter." },
        { id: "3", minute: "77", text: "Substitution: Mugisha on for Manzi." },
      ],
      quickActions: [
        { id: "qa-tickets", label: "Buy tickets", href: "tickets" },
        { id: "qa-shop", label: "Shop kits", href: "shop" },
        { id: "qa-membership", label: "Join membership", href: "tel:*182*7*1#", metric: "*182*7*1#" },
        { id: "qa-sacco", label: "Save with SACCO", href: "tel:*182*1*1#", metric: "*182*1*1#" },
      ],
      stories: query.data ?? FALLBACK_STORIES,
    };
  }, [nextMatch, query.data]);
}
