import { getServiceRoleClient } from "@/supabase/service-role";

import {
  buildMockOrders,
  buildMockPosts,
  buildMockRewards,
  buildMockServices,
  buildMockTickets,
} from "./mocks";
import type {
  CommunityPost,
  DataResponse,
  RewardClaim,
  ServiceTicket,
  ShopOrder,
  Ticket,
} from "./types";

const withFallback = async <T>(
  table: string,
  select: string,
  builder: () => T[],
): Promise<DataResponse<T>> => {
  const client = getServiceRoleClient();
  if (!client) {
    return { data: builder(), source: "mock", error: "Supabase service role key not configured" };
  }

  const { data, error } = await client.from(table).select(select).limit(250);
  if (error || !data) {
    console.warn(`[admin] fallback to mock data for ${table}`, error);
    return { data: builder(), source: "mock", error: error?.message ?? "Unknown Supabase error" };
  }

  return { data: data as T[], source: "supabase" };
};

export const fetchTickets = () =>
  withFallback<Ticket>(
    "tickets",
    "id, subject, status, priority, assignee, channel, created_at",
    () => buildMockTickets(),
  );

export const fetchOrders = () =>
  withFallback<ShopOrder>(
    "shop_orders",
    "id, customer, total, status, fulfilled_at",
    () => buildMockOrders(),
  );

export const fetchServices = () =>
  withFallback<ServiceTicket>(
    "service_requests",
    "id, member, service, status, scheduled_for",
    () => buildMockServices(),
  );

export const fetchCommunityPosts = () =>
  withFallback<CommunityPost>(
    "community_posts",
    "id, author, topic, sentiment, flagged, created_at",
    () => buildMockPosts(),
  );

export const fetchRewards = () =>
  withFallback<RewardClaim>(
    "reward_claims",
    "id, member, reward, points, status, processed_at",
    () => buildMockRewards(),
  );
