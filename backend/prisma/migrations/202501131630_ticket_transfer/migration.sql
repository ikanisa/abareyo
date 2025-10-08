ALTER TABLE "TicketPass"
  ADD COLUMN "transferredToUserId" UUID,
  ADD COLUMN "transferredAt" TIMESTAMPTZ,
  ADD COLUMN "transferTokenHash" TEXT;

CREATE INDEX "idx_ticket_pass_transfer_token" ON "TicketPass" ("transferTokenHash");

ALTER TABLE "TicketPass"
  ADD CONSTRAINT "TicketPass_transferredToUserId_fkey" FOREIGN KEY ("transferredToUserId") REFERENCES "User"("id") ON DELETE SET NULL;
