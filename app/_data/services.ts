export type Partner = { id: string; name: string; logo: string; benefit: string; link?: string };
export type Sacco = { id: string; name: string; branch?: string };

export type QuoteAddon = { title: string; price: number };
export type InsuranceQuote = {
  id: string;
  partnerId: string;
  motoType: "moto" | "car";
  plate?: string;
  periodMonths: number;
  premium: number;
  addons: QuoteAddon[];
  ticketPerk?: { eligible: boolean; zone: "BLUE" | "VIP"; ruleText: string };
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

export type Deposit = {
  id: string;
  saccoId: string;
  amount: number;
  status: "pending" | "confirmed";
  ref?: string;
  pointsEarned: number;
  at: string;
};

export const PARTNERS: Partner[] = [
  {
    id: "ins",
    name: "InsuranceCo",
    logo: "/partners/insuranceco.svg",
    benefit: "Free match ticket on policies ≥ 25k RWF",
  },
  {
    id: "sacco",
    name: "SACCO+ Deposit",
    logo: "/partners/sacco.svg",
    benefit: "Double fan points on deposits today",
  },
  {
    id: "bank",
    name: "Bank+ Offers",
    logo: "/partners/bank.svg",
    benefit: "0% fee on first transfer",
  },
];

export const SACCO_LIST: Sacco[] = [
  { id: "skigali", name: "Kigali SACCO", branch: "CBD" },
  { id: "shuye", name: "Huye SACCO", branch: "Huye" },
];

// In-memory demo stores (MVP; replace with API later)
export const QUOTES: InsuranceQuote[] = [];
export const POLICIES: Policy[] = [];
export const DEPOSITS: Deposit[] = [];

export function formatRWF(n: number) {
  return `${n.toLocaleString("en-RW")} RWF`;
}

type ServicesListener = () => void;
const listeners = new Set<ServicesListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeServices(listener: ServicesListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServicesSnapshot() {
  return {
    quotes: [...QUOTES],
    policies: [...POLICIES],
    deposits: [...DEPOSITS],
  };
}

export function recordQuote(quote: InsuranceQuote) {
  QUOTES.push(quote);
  notify();
  return quote;
}

export function updateQuoteStatus(quoteId: string, status: InsuranceQuote["status"]) {
  const quote = QUOTES.find((q) => q.id === quoteId);
  if (quote) {
    quote.status = status;
    notify();
  }
  return quote;
}

export function recordPolicy(policy: Policy) {
  POLICIES.push(policy);
  notify();
  return policy;
}

export function recordDeposit(deposit: Deposit) {
  DEPOSITS.push(deposit);
  notify();
  return deposit;
}

export function findQuoteById(id: string) {
  return QUOTES.find((quote) => quote.id === id);
}
