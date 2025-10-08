CREATE TABLE "GateScan" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "passId" UUID NOT NULL,
  "stewardId" UUID,
  "result" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "GateScan_passId_fkey" FOREIGN KEY ("passId") REFERENCES "TicketPass"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_gate_scan_pass" ON "GateScan" ("passId");
CREATE INDEX "idx_gate_scan_created" ON "GateScan" ("createdAt");
