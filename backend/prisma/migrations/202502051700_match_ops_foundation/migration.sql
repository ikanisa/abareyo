-- Prisma migration: Admin match operations foundation

CREATE TABLE "MatchGate" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "matchId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "maxThroughput" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "MatchGate_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE TABLE "TicketZone" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "matchId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "gate" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "TicketZone_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "idx_match_gate_unique" ON "MatchGate" ("matchId", "name");
CREATE UNIQUE INDEX "idx_ticket_zone_unique" ON "TicketZone" ("matchId", "name");
