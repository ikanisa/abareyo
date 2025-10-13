export type Partner = {
  id: string;
  name: string;
  title: string;
  logo: string;
  benefit: string;
  link?: string;
  ctaLabel: string;
  href: string;
  termsHref: string;
  category: "insurance" | "sacco" | "bank" | "future";
};

export type InsuranceQuote = {
  id: string;
  partnerId: string;
  motoType: "moto" | "car";
  plate?: string;
  periodMonths: number;
  premium: number;
  addons: { id: string; title: string; description: string; price: number }[];
  ticketPerk?: {
    eligible: boolean;
    zone: "BLUE" | "VIP";
    ruleText: string;
  };
  status: "draft" | "quoted" | "paid" | "issued";
};

export type Policy = {
  id: string;
  quoteId: string;
  number: string;
  validFrom: string;
  validTo: string;
  ticketPerkIssued?: boolean;
};

export type Sacco = {
  id: string;
  name: string;
  branch?: string;
};

export type Deposit = {
  id: string;
  saccoId: string;
  amount: number;
  status: "pending" | "confirmed";
  ref?: string;
  pointsEarned: number;
  createdAt: string;
};

export type PartnerServicesPromo = {
  id: string;
  badge: string;
  message: string;
  description: string;
  href: string;
  cta: string;
};

export type RewardRule = {
  id: string;
  title: string;
  description: string;
  type: "ticket" | "points";
};

export type ServiceHistoryItem = {
  id: string;
  type: "insurance-quote" | "policy" | "deposit";
  title: string;
  description: string;
  status: string;
  timestamp: string;
  href?: string;
};

export const partnerServicesHero = {
  title: "Partner Services — Earn Perks While You Save & Insure",
  subtitle:
    "Protect your ride, grow your savings, and unlock exclusive Rayon perks without leaving the app.",
  sponsors: [
    { id: "akili", name: "Akili Insurance" },
    { id: "inkunga", name: "Inkunga SACCO" },
    { id: "umuhinzi", name: "Umuhinzi Bank" },
  ],
};

export const partnerServices: Partner[] = [
  {
    id: "motor-insurance",
    name: "Akili Insurance",
    title: "Motor Insurance",
    logo: "🛡️",
    benefit: "Free match ticket on policies above 25k RWF",
    ctaLabel: "Get Quote",
    href: "#motor-insurance",
    termsHref: "#motor-insurance-terms",
    category: "insurance",
  },
  {
    id: "sacco-deposit",
    name: "Inkunga Ibimina",
    title: "SACCO Deposit",
    logo: "🤝",
    benefit: "Double fan points on deposits today",
    ctaLabel: "Deposit Now",
    href: "#sacco-deposit",
    termsHref: "#sacco-terms",
    category: "sacco",
  },
  {
    id: "bank-offers",
    name: "Umuhinzi Bank",
    title: "Bank Offers",
    logo: "🏦",
    benefit: "Low-interest fan bundles for group savings",
    ctaLabel: "Explore Offers",
    href: "#bank-offers",
    termsHref: "#bank-terms",
    category: "bank",
  },
  {
    id: "coming-soon",
    name: "More Partners",
    title: "More Services",
    logo: "✨",
    benefit: "Utilities, travel, and health coming soon",
    ctaLabel: "Request a service",
    href: "#future-services",
    termsHref: "#future-services",
    category: "future",
    link: "/community",
  },
];

export const insuranceQuoteTemplate: InsuranceQuote = {
  id: "quote-akili-001",
  partnerId: "motor-insurance",
  motoType: "moto",
  plate: "RAA123C",
  periodMonths: 6,
  premium: 18000,
  addons: [
    {
      id: "passenger",
      title: "Passenger cover",
      description: "Protect a rider or passenger up to 1M RWF",
      price: 5000,
    },
    {
      id: "theft",
      title: "Theft protection",
      description: "Covers theft with GPS recovery support",
      price: 7000,
    },
    {
      id: "roadside",
      title: "Roadside assistance",
      description: "Tow support within Kigali City",
      price: 3000,
    },
  ],
  ticketPerk: {
    eligible: true,
    zone: "BLUE",
    ruleText: "Spend ≥ 25k RWF on policy → 1 free ticket (Blue Zone)",
  },
  status: "quoted",
};

export const activePolicy: Policy = {
  id: "policy-001",
  quoteId: "quote-akili-001",
  number: "AK-2024-04567",
  validFrom: "2024-04-01",
  validTo: "2025-03-31",
  ticketPerkIssued: false,
};

export const saccoDirectory: Sacco[] = [
  { id: "inkunga-hq", name: "Inkunga SACCO", branch: "Nyamirambo" },
  { id: "umucyo", name: "Umucyo Cooperative", branch: "Remera" },
  { id: "abahizi", name: "Abahizi Ibimina", branch: "Kicukiro" },
];

export const latestDeposit: Deposit = {
  id: "dep-20240412",
  saccoId: "inkunga-hq",
  amount: 12000,
  status: "confirmed",
  ref: "MTN9823",
  pointsEarned: 24,
  createdAt: "2024-04-12T10:24:00+02:00",
};

export const depositsHistory: Deposit[] = [
  latestDeposit,
  {
    id: "dep-20240401",
    saccoId: "umucyo",
    amount: 8000,
    status: "confirmed",
    ref: "AIRT4210",
    pointsEarned: 8,
    createdAt: "2024-04-01T16:50:00+02:00",
  },
];

export const rewardRules: RewardRule[] = [
  {
    id: "ticket-perk",
    title: "Free match ticket",
    description: "Spend ≥ 25k RWF on a policy and claim a Blue Zone ticket.",
    type: "ticket",
  },
  {
    id: "double-points",
    title: "Double fan points",
    description: "Deposit ≥ 10k RWF into partner SACCOs to earn 2× fan points today.",
    type: "points",
  },
];

export const partnerPerks = [
  "Free match ticket with qualifying insurance premiums",
  "Double loyalty points on SACCO deposits",
  "Priority customer support from partner desks",
];

export const servicesHistory: ServiceHistoryItem[] = [
  {
    id: "hist-quote-001",
    type: "insurance-quote",
    title: "Akili Insurance quote",
    description: "Comprehensive moto cover for 6 months",
    status: "Awaiting payment",
    timestamp: "Apr 18, 2024 • 09:15",
    href: "#motor-insurance",
  },
  {
    id: "hist-policy-001",
    type: "policy",
    title: "Policy AK-2024-04567",
    description: "Valid until 31 Mar 2025",
    status: "Ticket perk unlocked",
    timestamp: "Apr 12, 2024 • 12:05",
    href: "#policy-card",
  },
  {
    id: "hist-deposit-001",
    type: "deposit",
    title: "Inkunga SACCO deposit",
    description: "12,000 RWF • +24 fan points",
    status: "Confirmed",
    timestamp: "Apr 12, 2024 • 10:24",
    href: "#sacco-deposit",
  },
];

export const partnerServicesPromo: PartnerServicesPromo = {
  id: "match-week-insurance",
  badge: "Match week perk",
  message: "Insure your moto → Free ticket for Sat's game",
  description: "Policies above 25k RWF unlock a Blue Zone seat. Powered by Akili Insurance.",
  href: "/services?focus=insurance",
  cta: "Get quote",
};

export const insuranceUssdTemplate = {
  shortcode: "*182*1*1*250250*{amount}%23",
  helper: "Dial to pay via MTN MoMo or Airtel Money",
};

export const depositUssdTemplate = {
  shortcode: "*182*1*1*250650*{amount}%23",
  helper: "Use partner SACCO wallet code to confirm",
};

export const bankInsights = [
  {
    id: "bundle-01",
    title: "Matchday emergency fund",
    description: "Save 5,000 RWF monthly and unlock 8% interest with Umuhinzi Bank.",
  },
  {
    id: "bundle-02",
    title: "Travel partner loans",
    description: "Qualified fans receive instant 150k RWF travel float for away games.",
  },
];
