import { z } from "zod";

import { insuranceContracts } from "@rayon/contracts/insurance";

export const insuranceSchemas = insuranceContracts.latest.schemas;

export type InsuranceAddonContract = z.infer<typeof insuranceSchemas.addon>;
export type InsuranceTicketPerkContract = z.infer<typeof insuranceSchemas.ticketPerk>;
export type InsuranceQuoteContract = z.infer<typeof insuranceSchemas.quote>;
export type InsurancePolicyContract = z.infer<typeof insuranceSchemas.policy>;
export type InsuranceQuoteRequestContract = z.infer<typeof insuranceSchemas.quoteRequest>;
export type InsuranceQuoteResponseContract = z.infer<typeof insuranceSchemas.quoteResponse>;
export type InsurancePaymentStatusContract = z.infer<typeof insuranceSchemas.paymentStatus>;
