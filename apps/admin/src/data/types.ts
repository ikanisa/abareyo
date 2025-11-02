export type Ticket = {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignee: string | null;
  channel: "web" | "mobile" | "whatsapp" | "ussd";
  created_at: string;
};

export type ShopOrder = {
  id: string;
  customer: string;
  total: number;
  status: "pending" | "paid" | "fulfilled" | "refunded";
  fulfilled_at: string | null;
};

export type ServiceTicket = {
  id: string;
  member: string;
  service: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_for: string;
};

export type CommunityPost = {
  id: string;
  author: string;
  topic: string;
  sentiment: "positive" | "neutral" | "negative";
  flagged: boolean;
  created_at: string;
};

export type RewardClaim = {
  id: string;
  member: string;
  reward: string;
  points: number;
  status: "pending" | "approved" | "denied" | "fulfilled";
  processed_at: string | null;
};

export type DataResponse<T> = {
  data: T[];
  source: "supabase" | "mock";
  error?: string;
};
