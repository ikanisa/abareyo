-- Prisma migration: Fan session support

CREATE TABLE "FanSession" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ,
  "revoked" BOOLEAN NOT NULL DEFAULT false,
  "ip" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "FanSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FanSession_userId_revoked_idx" ON "FanSession"("userId", "revoked");
