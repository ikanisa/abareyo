import { z } from "zod";

import { defineVersionedContracts, isoDateStringSchema } from "../versioning";

const retailProductVariantSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: z.number().nonnegative(),
  currency: z.string(),
  stock: z.number().int().nonnegative(),
  media: z.array(z.string()).optional(),
});

const retailProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  price: z.number(),
  currency: z.string(),
  stock: z.number().int(),
  imageUrl: z.string().nullable().optional(),
  media: z.array(z.string()).optional(),
  variants: z.array(retailProductVariantSchema).optional(),
  tags: z.array(z.string()).optional(),
  updatedAt: z.string().optional(),
});

const retailInventorySchema = z.object({
  updatedAt: z.string(),
  products: z.array(retailProductSchema),
});

const retailOrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  currency: z.string(),
  variantLabel: z.string().nullable().optional(),
});

const retailCheckoutRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  channel: z.enum(["mtn", "airtel"]),
  userId: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

const retailCheckoutResponseSchema = z.object({
  orderId: z.string(),
  paymentId: z.string().optional(),
  total: z.number(),
  ussdCode: z.string(),
  expiresAt: z.string(),
});

const retailLedgerEntrySchema = z.object({
  id: z.string(),
  accountId: z.string(),
  direction: z.enum(["credit", "debit"]),
  amount: z.number(),
  currency: z.string(),
  description: z.string().nullable().optional(),
  occurredAt: isoDateStringSchema,
  reference: z.string().nullable().optional(),
});

const retailWalletAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.number(),
  currency: z.string(),
  updatedAt: isoDateStringSchema,
});

const retailWalletSnapshotSchema = z.object({
  account: retailWalletAccountSchema,
  recentActivity: z.array(retailLedgerEntrySchema),
});

const retailVersion20241201 = {
  version: "2024-12-01",
  introducedAt: "2024-12-01",
  schemas: {
    product: retailProductSchema,
    productVariant: retailProductVariantSchema,
    inventory: retailInventorySchema,
    orderItem: retailOrderItemSchema,
    checkoutRequest: retailCheckoutRequestSchema,
    checkoutResponse: retailCheckoutResponseSchema,
    walletAccount: retailWalletAccountSchema,
    ledgerEntry: retailLedgerEntrySchema,
    walletSnapshot: retailWalletSnapshotSchema,
  },
  changes: [
    "Initial retail contracts capturing catalog, checkout, and wallet ledger shapes used by shop flows.",
  ],
} as const;

export const retailContracts = defineVersionedContracts({
  domain: "retail",
  policy: {
    minimumSupportDays: 150,
    notes: "Retail schemas will be supported through at least one quarterly release after a successor is published.",
  },
  versions: [retailVersion20241201],
});

export type RetailProductContract = z.infer<typeof retailProductSchema>;
export type RetailProductVariantContract = z.infer<typeof retailProductVariantSchema>;
export type RetailInventoryContract = z.infer<typeof retailInventorySchema>;
export type RetailOrderItemContract = z.infer<typeof retailOrderItemSchema>;
export type RetailCheckoutRequestContract = z.infer<typeof retailCheckoutRequestSchema>;
export type RetailCheckoutResponseContract = z.infer<typeof retailCheckoutResponseSchema>;
export type RetailLedgerEntryContract = z.infer<typeof retailLedgerEntrySchema>;
export type RetailWalletAccountContract = z.infer<typeof retailWalletAccountSchema>;
export type RetailWalletSnapshotContract = z.infer<typeof retailWalletSnapshotSchema>;
