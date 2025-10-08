-- Prisma migration: Rayon Sports initial schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'live', 'finished', 'postponed');
CREATE TYPE "TicketOrderStatus" AS ENUM ('pending', 'paid', 'cancelled', 'expired');
CREATE TYPE "TicketPassState" AS ENUM ('active', 'used', 'refunded');
CREATE TYPE "PaymentKind" AS ENUM ('ticket', 'membership', 'shop', 'donation');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'confirmed', 'failed', 'manual_review');
CREATE TYPE "SmsIngestStatus" AS ENUM ('received', 'parsed', 'error');
CREATE TYPE "MembershipStatus" AS ENUM ('pending', 'active', 'expired', 'cancelled');
CREATE TYPE "GamificationKind" AS ENUM ('prediction', 'checkin', 'quiz', 'donation_bonus');
CREATE TYPE "LeaderboardPeriod" AS ENUM ('weekly', 'monthly', 'seasonal');

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "locale" TEXT NOT NULL DEFAULT 'rw',
  "phoneMask" TEXT,
  "status" TEXT NOT NULL DEFAULT 'guest',
  "preferredZone" TEXT,
  "fcmToken" TEXT
);

CREATE TABLE "Match" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "opponent" TEXT NOT NULL,
  "kickoff" TIMESTAMPTZ NOT NULL,
  "venue" TEXT NOT NULL,
  "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
  "competition" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "TicketOrder" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  "matchId" UUID NOT NULL,
  "total" INTEGER NOT NULL,
  "status" "TicketOrderStatus" NOT NULL DEFAULT 'pending',
  "ussdCode" TEXT NOT NULL,
  "smsRef" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "TicketOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "TicketOrder_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_ticket_orders_status" ON "TicketOrder" ("status");
CREATE INDEX "idx_ticket_orders_created" ON "TicketOrder" ("createdAt");

CREATE TABLE "TicketOrderItem" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL,
  "zone" TEXT NOT NULL,
  "gate" TEXT,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "TicketOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE CASCADE
);

CREATE TABLE "TicketPass" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL,
  "zone" TEXT NOT NULL,
  "gate" TEXT,
  "qrTokenHash" TEXT NOT NULL,
  "state" "TicketPassState" NOT NULL DEFAULT 'active',
  "activatedAt" TIMESTAMPTZ,
  "consumedAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "TicketPass_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE CASCADE,
  CONSTRAINT "TicketPass_qrTokenHash_key" UNIQUE ("qrTokenHash")
);

CREATE TABLE "SmsRaw" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "fromMsisdn" TEXT NOT NULL,
  "toMsisdn" TEXT,
  "text" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "ingestStatus" "SmsIngestStatus" NOT NULL DEFAULT 'received'
);

CREATE TABLE "SmsParsed" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "smsId" UUID NOT NULL UNIQUE,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "payerMask" TEXT,
  "ref" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "confidence" NUMERIC NOT NULL,
  "parserVersion" TEXT,
  "parsedPayload" JSONB,
  "matchedEntity" TEXT,
  CONSTRAINT "SmsParsed_smsId_fkey" FOREIGN KEY ("smsId") REFERENCES "SmsRaw"("id") ON DELETE CASCADE
);

CREATE TABLE "MembershipPlan" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "perks" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE "Membership" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "planId" UUID NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'pending',
  "startedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "autoRenew" BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE
);

CREATE TABLE "Product" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "price" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL,
  "images" JSONB NOT NULL,
  "category" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Order" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  "total" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "shippingAddress" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "OrderItem" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "qty" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
  CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

CREATE TABLE "FundProject" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "goal" INTEGER NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "coverImage" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "FundDonation" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "projectId" UUID NOT NULL,
  "userId" UUID,
  "amount" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "FundDonation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "FundProject"("id") ON DELETE CASCADE,
  CONSTRAINT "FundDonation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "GamificationEvent" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "kind" "GamificationKind" NOT NULL,
  "value" INTEGER NOT NULL,
  "context" JSONB,
  "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "GamificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Leaderboard" (
  "period" "LeaderboardPeriod" NOT NULL,
  "userId" UUID NOT NULL,
  "points" INTEGER NOT NULL,
  "rank" INTEGER NOT NULL,
  "snapshotAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("period", "userId"),
  CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "FanClub" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "region" TEXT,
  "bio" TEXT,
  "isOfficial" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "FanClubMember" (
  "fanClubId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("fanClubId", "userId"),
  CONSTRAINT "FanClubMember_fanClubId_fkey" FOREIGN KEY ("fanClubId") REFERENCES "FanClub"("id") ON DELETE CASCADE,
  CONSTRAINT "FanClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Post" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "authorId" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "media" JSONB,
  "visibility" TEXT NOT NULL DEFAULT 'public',
  "status" TEXT NOT NULL DEFAULT 'published',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "PostReaction" (
  "postId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'like',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("postId", "userId"),
  CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
  CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Poll" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "question" TEXT NOT NULL,
  "authorId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Poll_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "PollOption" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "pollId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE
);

CREATE TABLE "PollVote" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "pollId" UUID NOT NULL,
  "optionId" UUID NOT NULL,
  "userId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE,
  CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE,
  CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "AdminAction" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "actorId" UUID,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AdminAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "Payment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "kind" "PaymentKind" NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "smsParsedId" UUID,
  "orderId" UUID,
  "membershipId" UUID,
  "donationId" UUID,
  "metadata" JSONB,
  "confirmedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Payment_smsParsedId_fkey" FOREIGN KEY ("smsParsedId") REFERENCES "SmsParsed"("id") ON DELETE SET NULL,
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE SET NULL,
  CONSTRAINT "Payment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL,
  CONSTRAINT "Payment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "FundDonation"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_payments_status" ON "Payment" ("status");

