import { z } from "zod";

import { saccoContracts } from "@rayon/contracts/sacco";

export const saccoSchemas = saccoContracts.latest.schemas;

export type SaccoDirectoryEntryContract = z.infer<typeof saccoSchemas.directoryEntry>;
export type SaccoDepositContract = z.infer<typeof saccoSchemas.deposit>;
export type SaccoDepositRequestContract = z.infer<typeof saccoSchemas.depositRequest>;
export type SaccoDepositResponseContract = z.infer<typeof saccoSchemas.depositResponse>;
