import { faker } from "@faker-js/faker";

import type { CommunityPost, RewardClaim, ServiceTicket, ShopOrder, Ticket } from "./types";

faker.seed(42);

const randomStatus = <T extends string>(values: readonly T[]) => values[faker.number.int({ min: 0, max: values.length - 1 })];

export const buildMockTickets = (count = 24): Ticket[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `T-${2024000 + index}`,
    subject: faker.hacker.phrase(),
    status: randomStatus(["open", "pending", "resolved", "closed"] as const),
    priority: randomStatus(["low", "medium", "high"] as const),
    assignee: faker.person.fullName(),
    channel: randomStatus(["web", "mobile", "whatsapp", "ussd"] as const),
    created_at: faker.date.recent({ days: 30 }).toISOString(),
  }));

export const buildMockOrders = (count = 30): ShopOrder[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `O-${2024400 + index}`,
    customer: faker.person.fullName(),
    total: faker.number.float({ min: 25, max: 250, fractionDigits: 2 }),
    status: randomStatus(["pending", "paid", "fulfilled", "refunded"] as const),
    fulfilled_at: faker.helpers.maybe(() => faker.date.recent({ days: 14 }).toISOString(), { probability: 0.55 }) ?? null,
  }));

export const buildMockServices = (count = 18): ServiceTicket[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `S-${2024100 + index}`,
    member: faker.person.fullName(),
    service: faker.helpers.arrayElement([
      "Hospitality upgrade",
      "Parking assistance",
      "Fan experience",
      "Membership onboarding",
    ]),
    status: randomStatus(["scheduled", "in_progress", "completed", "cancelled"] as const),
    scheduled_for: faker.date.soon({ days: 21 }).toISOString(),
  }));

export const buildMockPosts = (count = 20): CommunityPost[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `C-${2024300 + index}`,
    author: faker.internet.displayName(),
    topic: faker.hacker.noun(),
    sentiment: randomStatus(["positive", "neutral", "negative"] as const),
    flagged: faker.datatype.boolean({ probability: 0.2 }),
    created_at: faker.date.recent({ days: 7 }).toISOString(),
  }));

export const buildMockRewards = (count = 22): RewardClaim[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `R-${2024500 + index}`,
    member: faker.person.fullName(),
    reward: faker.helpers.arrayElement([
      "Merch pack",
      "VIP upgrade",
      "Training pass",
      "Merch voucher",
    ]),
    points: faker.number.int({ min: 250, max: 3200 }),
    status: randomStatus(["pending", "approved", "denied", "fulfilled"] as const),
    processed_at: faker.helpers.maybe(() => faker.date.recent({ days: 10 }).toISOString(), { probability: 0.5 }) ?? null,
  }));
