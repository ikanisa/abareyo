import { z } from "zod";

import { defineVersionedContracts, isoDateStringSchema } from "../versioning";

const saccoDirectoryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  branch: z.string().optional(),
});

const saccoDepositSchema = z.object({
  id: z.string(),
  saccoId: z.string(),
  amount: z.number(),
  status: z.enum(["pending", "confirmed", "failed"]),
  ref: z.string().optional(),
  pointsEarned: z.number().nonnegative().optional(),
  createdAt: isoDateStringSchema,
});

const saccoDepositRequestSchema = z.object({
  saccoId: z.string(),
  amount: z.number().positive(),
  channel: z.enum(["mtn", "airtel"]),
  userId: z.string().optional(),
});

const saccoDepositResponseSchema = z.object({
  depositId: z.string(),
  ussdCode: z.string(),
  expiresAt: z.string(),
});

const saccoVersion20241201 = {
  version: "2024-12-01",
  introducedAt: "2024-12-01",
  schemas: {
    directoryEntry: saccoDirectoryEntrySchema,
    deposit: saccoDepositSchema,
    depositRequest: saccoDepositRequestSchema,
    depositResponse: saccoDepositResponseSchema,
  },
  changes: [
    "Initial SACCO contracts for directory, deposit initiation, and payment handoff flows.",
  ],
} as const;

export const saccoContracts = defineVersionedContracts({
  domain: "sacco",
  policy: {
    minimumSupportDays: 150,
    notes: "SACCO contracts adopt a rolling deprecation window aligned with partner banking releases.",
  },
  versions: [saccoVersion20241201],
});

export type SaccoDirectoryEntryContract = z.infer<typeof saccoDirectoryEntrySchema>;
export type SaccoDepositContract = z.infer<typeof saccoDepositSchema>;
export type SaccoDepositRequestContract = z.infer<typeof saccoDepositRequestSchema>;
export type SaccoDepositResponseContract = z.infer<typeof saccoDepositResponseSchema>;
