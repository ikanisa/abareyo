import { z } from "zod";

import { defineVersionedContracts, isoDateStringSchema } from "../versioning";

const insuranceAddonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
});

const insuranceTicketPerkSchema = z.object({
  eligible: z.boolean(),
  zone: z.string().optional(),
  ruleText: z.string().optional(),
});

const insuranceQuoteSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  motoType: z.enum(["moto", "car"]),
  plate: z.string(),
  periodMonths: z.number().int().positive(),
  premium: z.number().nonnegative(),
  addons: z.array(insuranceAddonSchema),
  ticketPerk: insuranceTicketPerkSchema.optional(),
  status: z.enum(["quoted", "paid", "issued"]),
});

const insurancePolicySchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  number: z.string(),
  validFrom: isoDateStringSchema,
  validTo: isoDateStringSchema,
  ticketPerkIssued: z.boolean().optional(),
});

const insuranceQuoteRequestSchema = z.object({
  motoType: z.enum(["moto", "car"]),
  plate: z.string(),
  coverageMonths: z.number().int().positive(),
  addons: z.array(z.string()).default([]),
  contactPhone: z.string(),
});

const insuranceQuoteResponseSchema = z.object({
  quote: insuranceQuoteSchema.pick({ id: true, premium: true }),
});

const insurancePaymentStatusSchema = z.object({
  quoteId: z.string(),
  status: z.enum(["idle", "pending", "confirmed"]),
  premium: z.number(),
});

const insuranceVersion20241201 = {
  version: "2024-12-01",
  introducedAt: "2024-12-01",
  schemas: {
    addon: insuranceAddonSchema,
    ticketPerk: insuranceTicketPerkSchema,
    quote: insuranceQuoteSchema,
    policy: insurancePolicySchema,
    quoteRequest: insuranceQuoteRequestSchema,
    quoteResponse: insuranceQuoteResponseSchema,
    paymentStatus: insurancePaymentStatusSchema,
  },
  changes: [
    "Initial insurance contracts defining quotes, policy issuance, and payment tracking payloads.",
  ],
} as const;

export const insuranceContracts = defineVersionedContracts({
  domain: "insurance",
  policy: {
    minimumSupportDays: 120,
    notes: "Insurance versions are supported through at least one renewal cycle. Deprecated versions receive 30 days notice.",
  },
  versions: [insuranceVersion20241201],
});

export type InsuranceAddonContract = z.infer<typeof insuranceAddonSchema>;
export type InsuranceTicketPerkContract = z.infer<typeof insuranceTicketPerkSchema>;
export type InsuranceQuoteContract = z.infer<typeof insuranceQuoteSchema>;
export type InsurancePolicyContract = z.infer<typeof insurancePolicySchema>;
export type InsuranceQuoteRequestContract = z.infer<typeof insuranceQuoteRequestSchema>;
export type InsuranceQuoteResponseContract = z.infer<typeof insuranceQuoteResponseSchema>;
export type InsurancePaymentStatusContract = z.infer<typeof insurancePaymentStatusSchema>;
