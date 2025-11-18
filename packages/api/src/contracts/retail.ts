import { z } from "zod";

import { retailContracts } from "@rayon/contracts/retail";

export const retailSchemas = retailContracts.latest.schemas;

export type RetailProductContract = z.infer<typeof retailSchemas.product>;
export type RetailProductVariantContract = z.infer<typeof retailSchemas.productVariant>;
export type RetailInventoryContract = z.infer<typeof retailSchemas.inventory>;
export type RetailOrderItemContract = z.infer<typeof retailSchemas.orderItem>;
export type RetailCheckoutRequestContract = z.infer<typeof retailSchemas.checkoutRequest>;
export type RetailCheckoutResponseContract = z.infer<typeof retailSchemas.checkoutResponse>;
export type RetailLedgerEntryContract = z.infer<typeof retailSchemas.ledgerEntry>;
export type RetailWalletAccountContract = z.infer<typeof retailSchemas.walletAccount>;
export type RetailWalletSnapshotContract = z.infer<typeof retailSchemas.walletSnapshot>;
