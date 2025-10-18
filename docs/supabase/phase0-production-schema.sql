


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."GamificationKind" AS ENUM (
    'prediction',
    'checkin',
    'quiz',
    'donation_bonus'
);


ALTER TYPE "public"."GamificationKind" OWNER TO "postgres";


CREATE TYPE "public"."LeaderboardPeriod" AS ENUM (
    'weekly',
    'monthly',
    'seasonal'
);


ALTER TYPE "public"."LeaderboardPeriod" OWNER TO "postgres";


CREATE TYPE "public"."MatchStatus" AS ENUM (
    'scheduled',
    'live',
    'finished',
    'postponed'
);


ALTER TYPE "public"."MatchStatus" OWNER TO "postgres";


CREATE TYPE "public"."MembershipStatus" AS ENUM (
    'pending',
    'active',
    'expired',
    'cancelled'
);


ALTER TYPE "public"."MembershipStatus" OWNER TO "postgres";


CREATE TYPE "public"."PaymentKind" AS ENUM (
    'ticket',
    'membership',
    'shop',
    'donation'
);


ALTER TYPE "public"."PaymentKind" OWNER TO "postgres";


CREATE TYPE "public"."PaymentStatus" AS ENUM (
    'pending',
    'confirmed',
    'failed',
    'manual_review'
);


ALTER TYPE "public"."PaymentStatus" OWNER TO "postgres";


CREATE TYPE "public"."SmsIngestStatus" AS ENUM (
    'received',
    'parsed',
    'error'
);


ALTER TYPE "public"."SmsIngestStatus" OWNER TO "postgres";


CREATE TYPE "public"."TicketOrderStatus" AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'expired'
);


ALTER TYPE "public"."TicketOrderStatus" OWNER TO "postgres";


CREATE TYPE "public"."TicketPassState" AS ENUM (
    'active',
    'used',
    'refunded'
);


ALTER TYPE "public"."TicketPassState" OWNER TO "postgres";


CREATE TYPE "public"."insurance_status" AS ENUM (
    'quoted',
    'paid',
    'issued'
);


ALTER TYPE "public"."insurance_status" OWNER TO "postgres";


CREATE TYPE "public"."match_status" AS ENUM (
    'upcoming',
    'live',
    'ft'
);


ALTER TYPE "public"."match_status" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'paid',
    'ready',
    'pickedup'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_kind" AS ENUM (
    'ticket',
    'shop',
    'deposit',
    'policy'
);


ALTER TYPE "public"."payment_kind" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'confirmed',
    'failed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."sacco_status" AS ENUM (
    'pending',
    'confirmed'
);


ALTER TYPE "public"."sacco_status" OWNER TO "postgres";


CREATE TYPE "public"."ticket_order_status" AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'expired'
);


ALTER TYPE "public"."ticket_order_status" OWNER TO "postgres";


CREATE TYPE "public"."ticket_pass_state" AS ENUM (
    'active',
    'used',
    'refunded'
);


ALTER TYPE "public"."ticket_pass_state" OWNER TO "postgres";


CREATE TYPE "public"."ticket_zone" AS ENUM (
    'VIP',
    'Regular',
    'Blue'
);


ALTER TYPE "public"."ticket_zone" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'pending',
    'confirmed',
    'failed',
    'manual_review'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'deposit',
    'purchase',
    'refund',
    'reward'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_tier" AS ENUM (
    'guest',
    'fan',
    'gold'
);


ALTER TYPE "public"."user_tier" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_points_on_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  add_points int := rewards_points_for(NEW.kind, NEW.amount);
  owning_user uuid;
BEGIN
  IF add_points > 0 THEN
    IF NEW.ticket_order_id IS NOT NULL THEN
      SELECT user_id INTO owning_user FROM ticket_orders WHERE id = NEW.ticket_order_id;
    ELSIF NEW.order_id IS NOT NULL THEN
      SELECT user_id INTO owning_user FROM orders WHERE id = NEW.order_id;
    END IF;
    IF owning_user IS NOT NULL THEN
      UPDATE users SET points = COALESCE(points,0) + add_points WHERE id = owning_user;
      INSERT INTO rewards_events (user_id, source, ref_id, points, meta)
      VALUES (owning_user, 'transaction', NEW.id, add_points, jsonb_build_object('kind', NEW.kind, 'amount', NEW.amount));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."award_points_on_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_points"("p_user_id" "uuid", "p_points_delta" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update users
  set points = coalesce(points, 0) + coalesce(p_points_delta, 0)
  where id = p_user_id;
end;
$$;


ALTER FUNCTION "public"."increment_user_points"("p_user_id" "uuid", "p_points_delta" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rewards_points_for"("kind" "text", "amount" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF kind = 'deposit' THEN
    RETURN GREATEST(1, ROUND(amount * 0.02));
  ELSIF kind = 'shop' THEN
    RETURN GREATEST(1, ROUND(amount * 0.01));
  ELSE
    RETURN 0;
  END IF;
END;
$$;


ALTER FUNCTION "public"."rewards_points_for"("kind" "text", "amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_ticket_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_ticket_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_wallet_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_wallet_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."AdminAction" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "actorId" "uuid",
    "targetType" "text" NOT NULL,
    "targetId" "text" NOT NULL,
    "action" "text" NOT NULL,
    "details" "jsonb",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."AdminAction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AdminRole" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."AdminRole" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AdminSession" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "adminUserId" "uuid" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expiresAt" timestamp with time zone,
    "revoked" boolean DEFAULT false NOT NULL,
    "ip" "text",
    "userAgent" "text"
);


ALTER TABLE "public"."AdminSession" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AdminUser" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "passwordHash" "text" NOT NULL,
    "displayName" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "lastLoginAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."AdminUser" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AdminUsersOnRoles" (
    "adminUserId" "uuid" NOT NULL,
    "roleId" "uuid" NOT NULL,
    "assignedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."AdminUsersOnRoles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AuditLog" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "adminUserId" "uuid",
    "action" "text" NOT NULL,
    "entityType" "text" NOT NULL,
    "entityId" "text",
    "before" "jsonb",
    "after" "jsonb",
    "ip" "text",
    "userAgent" "text"
);


ALTER TABLE "public"."AuditLog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FanClub" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "region" "text",
    "bio" "text",
    "isOfficial" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."FanClub" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FanClubMember" (
    "fanClubId" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joinedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."FanClubMember" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FanSession" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expiresAt" timestamp with time zone,
    "revoked" boolean DEFAULT false NOT NULL,
    "ip" "text",
    "userAgent" "text"
);


ALTER TABLE "public"."FanSession" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FeatureFlag" (
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedById" "uuid"
);


ALTER TABLE "public"."FeatureFlag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FundDonation" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "projectId" "uuid" NOT NULL,
    "userId" "uuid",
    "amount" integer NOT NULL,
    "status" "public"."PaymentStatus" DEFAULT 'pending'::"public"."PaymentStatus" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."FundDonation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FundProject" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "goal" integer NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "coverImage" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."FundProject" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."GamificationEvent" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "kind" "public"."GamificationKind" NOT NULL,
    "value" integer NOT NULL,
    "context" "jsonb",
    "occurredAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."GamificationEvent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."GateScan" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "passId" "uuid" NOT NULL,
    "stewardId" "uuid",
    "result" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."GateScan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Leaderboard" (
    "period" "public"."LeaderboardPeriod" NOT NULL,
    "userId" "uuid" NOT NULL,
    "points" integer NOT NULL,
    "rank" integer NOT NULL,
    "snapshotAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Match" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "opponent" "text" NOT NULL,
    "kickoff" timestamp with time zone NOT NULL,
    "venue" "text" NOT NULL,
    "status" "public"."MatchStatus" DEFAULT 'scheduled'::"public"."MatchStatus" NOT NULL,
    "competition" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Match" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."MatchGate" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "matchId" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "maxThroughput" integer,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."MatchGate" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Membership" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "planId" "uuid" NOT NULL,
    "status" "public"."MembershipStatus" DEFAULT 'pending'::"public"."MembershipStatus" NOT NULL,
    "startedAt" timestamp with time zone,
    "expiresAt" timestamp with time zone,
    "autoRenew" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Membership" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."MembershipPlan" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price" integer NOT NULL,
    "perks" "jsonb" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."MembershipPlan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Order" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid",
    "total" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "shippingAddress" "jsonb",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fulfillmentNotes" "jsonb" DEFAULT '[]'::"jsonb",
    "trackingNumber" "text",
    "fulfilledAt" timestamp(3) without time zone
);


ALTER TABLE "public"."Order" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."OrderItem" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "orderId" "uuid" NOT NULL,
    "productId" "uuid" NOT NULL,
    "qty" integer NOT NULL,
    "price" integer NOT NULL
);


ALTER TABLE "public"."OrderItem" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Payment" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "kind" "public"."PaymentKind" NOT NULL,
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'RWF'::"text" NOT NULL,
    "status" "public"."PaymentStatus" DEFAULT 'pending'::"public"."PaymentStatus" NOT NULL,
    "smsParsedId" "uuid",
    "orderId" "uuid",
    "membershipId" "uuid",
    "donationId" "uuid",
    "metadata" "jsonb",
    "confirmedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Payment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Permission" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "description" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Permission" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Poll" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question" "text" NOT NULL,
    "authorId" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "postId" "uuid"
);


ALTER TABLE "public"."Poll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PollOption" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pollId" "uuid" NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."PollOption" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PollVote" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pollId" "uuid" NOT NULL,
    "optionId" "uuid" NOT NULL,
    "userId" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."PollVote" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Post" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "authorId" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "media" "jsonb",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "status" "text" DEFAULT 'published'::"text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Post" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PostReaction" (
    "postId" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL,
    "kind" "text" DEFAULT 'like'::"text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."PostReaction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PredictionFixture" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "matchId" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "rewardPoints" integer DEFAULT 15 NOT NULL,
    "deadline" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."PredictionFixture" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Product" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "price" integer NOT NULL,
    "stock" integer NOT NULL,
    "images" "jsonb" NOT NULL,
    "category" "text",
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Product" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Quiz" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "prompt" "text" NOT NULL,
    "correctAnswer" "text" NOT NULL,
    "rewardPoints" integer DEFAULT 20 NOT NULL,
    "activeFrom" timestamp with time zone DEFAULT "now"() NOT NULL,
    "activeUntil" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Quiz" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."RolePermission" (
    "roleId" "uuid" NOT NULL,
    "permissionId" "uuid" NOT NULL,
    "grantedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."RolePermission" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SmsParsed" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "smsId" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'RWF'::"text" NOT NULL,
    "payerMask" "text",
    "ref" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confidence" numeric NOT NULL,
    "parserVersion" "text",
    "parsedPayload" "jsonb",
    "matchedEntity" "text"
);


ALTER TABLE "public"."SmsParsed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SmsParserPrompt" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "label" "text" NOT NULL,
    "body" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "createdById" "uuid"
);


ALTER TABLE "public"."SmsParserPrompt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SmsRaw" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "receivedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fromMsisdn" "text" NOT NULL,
    "toMsisdn" "text",
    "text" "text" NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "ingestStatus" "public"."SmsIngestStatus" DEFAULT 'received'::"public"."SmsIngestStatus" NOT NULL
);


ALTER TABLE "public"."SmsRaw" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketOrder" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid",
    "matchId" "uuid" NOT NULL,
    "total" integer NOT NULL,
    "status" "public"."TicketOrderStatus" DEFAULT 'pending'::"public"."TicketOrderStatus" NOT NULL,
    "ussdCode" "text" NOT NULL,
    "smsRef" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."TicketOrder" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketOrderItem" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "orderId" "uuid" NOT NULL,
    "zone" "text" NOT NULL,
    "gate" "text",
    "price" integer NOT NULL,
    "quantity" integer NOT NULL
);


ALTER TABLE "public"."TicketOrderItem" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketPass" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "orderId" "uuid" NOT NULL,
    "zone" "text" NOT NULL,
    "gate" "text",
    "qrTokenHash" "text" NOT NULL,
    "state" "public"."TicketPassState" DEFAULT 'active'::"public"."TicketPassState" NOT NULL,
    "activatedAt" timestamp with time zone,
    "consumedAt" timestamp with time zone,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transferredToUserId" "uuid",
    "transferredAt" timestamp with time zone,
    "transferTokenHash" "text"
);


ALTER TABLE "public"."TicketPass" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketZone" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "matchId" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "capacity" integer NOT NULL,
    "price" integer NOT NULL,
    "gate" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."TicketZone" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Translation" (
    "lang" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedById" "uuid"
);


ALTER TABLE "public"."Translation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locale" "text" DEFAULT 'rw'::"text" NOT NULL,
    "phoneMask" "text",
    "status" "text" DEFAULT 'guest'::"text" NOT NULL,
    "preferredZone" "text",
    "fcmToken" "text"
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."UssdTemplate" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "telco" "text" NOT NULL,
    "body" "text" NOT NULL,
    "variables" "jsonb",
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedById" "uuid"
);


ALTER TABLE "public"."UssdTemplate" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_passes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "zone" "text",
    "gate" "text",
    "qr_token_hash" "text",
    "state" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ticket_passes_state_check" CHECK (("state" = ANY (ARRAY['active'::"text", 'used'::"text", 'refunded'::"text"])))
);

ALTER TABLE ONLY "public"."ticket_passes" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_passes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_dashboard_gate_throughput" AS
 SELECT COALESCE("gate", 'Unassigned'::"text") AS "gate",
    ("count"(*))::numeric AS "passes",
    24 AS "window_hours"
   FROM "public"."ticket_passes"
  WHERE ("created_at" >= ("now"() - '24:00:00'::interval))
  GROUP BY COALESCE("gate", 'Unassigned'::"text"), 24::integer;


ALTER VIEW "public"."admin_dashboard_gate_throughput" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "moto_type" "text",
    "plate" "text",
    "premium" integer NOT NULL,
    "ticket_perk" boolean DEFAULT false NOT NULL,
    "status" "public"."insurance_status" DEFAULT 'quoted'::"public"."insurance_status" NOT NULL,
    "ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."insurance_quotes" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "total" integer NOT NULL,
    "momo_ref" "text",
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."orders" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sacco_deposits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "sacco_name" "text" NOT NULL,
    "amount" integer NOT NULL,
    "ref" "text",
    "status" "public"."sacco_status" DEFAULT 'pending'::"public"."sacco_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."sacco_deposits" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."sacco_deposits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "match_id" "uuid",
    "total" integer NOT NULL,
    "status" "public"."ticket_order_status" DEFAULT 'pending'::"public"."ticket_order_status",
    "ussd_code" "text",
    "sms_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."ticket_orders" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_dashboard_kpis" AS
 WITH "tickets" AS (
         SELECT ("count"(*) FILTER (WHERE (("ticket_orders"."status" = 'paid'::"public"."ticket_order_status") AND ("ticket_orders"."created_at" >= ("now"() - '7 days'::interval)))))::numeric AS "value_7d",
            ("count"(*) FILTER (WHERE (("ticket_orders"."status" = 'paid'::"public"."ticket_order_status") AND ("ticket_orders"."created_at" >= ("now"() - '30 days'::interval)))))::numeric AS "value_30d"
           FROM "public"."ticket_orders"
        ), "shop" AS (
         SELECT (COALESCE("sum"("orders"."total") FILTER (WHERE (("orders"."status" = ANY (ARRAY['paid'::"public"."order_status", 'ready'::"public"."order_status", 'pickedup'::"public"."order_status"])) AND ("orders"."created_at" >= ("now"() - '7 days'::interval)))), (0)::bigint))::numeric AS "value_7d",
            (COALESCE("sum"("orders"."total") FILTER (WHERE (("orders"."status" = ANY (ARRAY['paid'::"public"."order_status", 'ready'::"public"."order_status", 'pickedup'::"public"."order_status"])) AND ("orders"."created_at" >= ("now"() - '30 days'::interval)))), (0)::bigint))::numeric AS "value_30d"
           FROM "public"."orders"
        ), "policies" AS (
         SELECT ("count"(*) FILTER (WHERE (("insurance_quotes"."status" = 'issued'::"public"."insurance_status") AND ("insurance_quotes"."created_at" >= ("now"() - '7 days'::interval)))))::numeric AS "value_7d",
            ("count"(*) FILTER (WHERE (("insurance_quotes"."status" = 'issued'::"public"."insurance_status") AND ("insurance_quotes"."created_at" >= ("now"() - '30 days'::interval)))))::numeric AS "value_30d"
           FROM "public"."insurance_quotes"
        ), "deposits" AS (
         SELECT (COALESCE("sum"("sacco_deposits"."amount") FILTER (WHERE (("sacco_deposits"."status" = 'confirmed'::"public"."sacco_status") AND ("sacco_deposits"."created_at" >= ("now"() - '7 days'::interval)))), (0)::bigint))::numeric AS "value_7d",
            (COALESCE("sum"("sacco_deposits"."amount") FILTER (WHERE (("sacco_deposits"."status" = 'confirmed'::"public"."sacco_status") AND ("sacco_deposits"."created_at" >= ("now"() - '30 days'::interval)))), (0)::bigint))::numeric AS "value_30d"
           FROM "public"."sacco_deposits"
        )
 SELECT 'tickets'::"text" AS "metric",
    "tickets"."value_7d",
    "tickets"."value_30d",
    'count'::"text" AS "format"
   FROM "tickets"
UNION ALL
 SELECT 'gmv'::"text" AS "metric",
    "shop"."value_7d",
    "shop"."value_30d",
    'currency'::"text" AS "format"
   FROM "shop"
UNION ALL
 SELECT 'policies'::"text" AS "metric",
    "policies"."value_7d",
    "policies"."value_30d",
    'count'::"text" AS "format"
   FROM "policies"
UNION ALL
 SELECT 'deposits'::"text" AS "metric",
    "deposits"."value_7d",
    "deposits"."value_30d",
    'currency'::"text" AS "format"
   FROM "deposits";


ALTER VIEW "public"."admin_dashboard_kpis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "public"."payment_kind" NOT NULL,
    "amount" integer NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "sms_parsed_id" "uuid",
    "order_id" "uuid",
    "membership_id" "uuid",
    "donation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ticket_order_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."payments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_dashboard_payment_metrics" AS
 WITH "confirmed" AS (
         SELECT "p"."id",
            "p"."created_at",
            COALESCE("to_ord"."created_at", "shop_ord"."created_at") AS "origin_created_at"
           FROM (("public"."payments" "p"
             LEFT JOIN "public"."ticket_orders" "to_ord" ON (("to_ord"."id" = "p"."ticket_order_id")))
             LEFT JOIN "public"."orders" "shop_ord" ON (("shop_ord"."id" = "p"."order_id")))
          WHERE (("p"."status" = 'confirmed'::"public"."payment_status") AND ("p"."created_at" >= ("now"() - '7 days'::interval)))
        ), "pending" AS (
         SELECT (( SELECT "count"(*) AS "count"
                   FROM "public"."ticket_orders"
                  WHERE ("ticket_orders"."status" = 'pending'::"public"."ticket_order_status")))::numeric AS "ticket_pending",
            (( SELECT "count"(*) AS "count"
                   FROM "public"."orders"
                  WHERE ("orders"."status" = 'pending'::"public"."order_status")))::numeric AS "shop_pending"
        )
 SELECT (( SELECT "count"(*) AS "count"
           FROM "confirmed"))::numeric AS "confirmed_count_7d",
    (COALESCE("ticket_pending", (0)::numeric) + COALESCE("shop_pending", (0)::numeric)) AS "pending_count",
    ( SELECT "avg"(EXTRACT(epoch FROM ("c"."created_at" - "c"."origin_created_at"))) AS "avg"
           FROM "confirmed" "c"
          WHERE ("c"."origin_created_at" IS NOT NULL)) AS "average_confirmation_seconds"
   FROM "pending";


ALTER VIEW "public"."admin_dashboard_payment_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_parsed" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sms_id" "uuid",
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'RWF'::"text",
    "payer_mask" "text",
    "ref" "text",
    "matched_entity" "text",
    "confidence" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."sms_parsed" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_parsed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_raw" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"(),
    "from_msisdn" "text",
    "text" "text" NOT NULL,
    "source" "text" DEFAULT 'gsm-daemon'::"text"
);

ALTER TABLE ONLY "public"."sms_raw" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_raw" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_dashboard_sms_metrics" AS
 WITH "raw" AS (
         SELECT ("count"(*) FILTER (WHERE ("sms_raw"."received_at" >= ("now"() - '7 days'::interval))))::numeric AS "raw_count_7d"
           FROM "public"."sms_raw"
        ), "parsed" AS (
         SELECT ("count"(*) FILTER (WHERE ("sp"."created_at" >= ("now"() - '7 days'::interval))))::numeric AS "parsed_count_7d",
            "avg"(EXTRACT(epoch FROM ("sp"."created_at" - "sr"."received_at"))) AS "avg_latency"
           FROM ("public"."sms_parsed" "sp"
             LEFT JOIN "public"."sms_raw" "sr" ON (("sr"."id" = "sp"."sms_id")))
          WHERE ("sp"."created_at" >= ("now"() - '7 days'::interval))
        )
 SELECT COALESCE("raw"."raw_count_7d", (0)::numeric) AS "raw_count_7d",
    COALESCE("parsed"."parsed_count_7d", (0)::numeric) AS "parsed_count_7d",
        CASE
            WHEN (COALESCE("raw"."raw_count_7d", (0)::numeric) = (0)::numeric) THEN NULL::numeric
            ELSE (COALESCE("parsed"."parsed_count_7d", (0)::numeric) / NULLIF("raw"."raw_count_7d", (0)::numeric))
        END AS "success_rate",
    "parsed"."avg_latency" AS "average_latency_seconds"
   FROM ("raw"
     CROSS JOIN "parsed");


ALTER VIEW "public"."admin_dashboard_sms_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE ONLY "public"."admin_roles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "revoked" boolean DEFAULT false NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."admin_sessions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "display_name" "text",
    "status" "text" DEFAULT 'active'::"text",
    "last_login" timestamp with time zone
);

ALTER TABLE ONLY "public"."admin_users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users_roles" (
    "admin_user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."admin_users_roles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "at" timestamp with time zone DEFAULT "now"(),
    "admin_user_id" "uuid",
    "action" "text",
    "entity_type" "text",
    "entity_id" "text",
    "before" "jsonb",
    "after" "jsonb",
    "ip" "text",
    "ua" "text"
);

ALTER TABLE ONLY "public"."audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "text" "text",
    "media_url" "text",
    "status" "text" DEFAULT 'visible'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "community_posts_status_check" CHECK (("status" = ANY (ARRAY['visible'::"text", 'hidden'::"text"])))
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text",
    "summary" "text",
    "body" "text",
    "media_url" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_items_kind_check" CHECK (("kind" = ANY (ARRAY['article'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."content_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fan_clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "members" integer DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY "public"."fan_clubs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."fan_clubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fan_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "text" "text",
    "media_url" "text",
    "likes" integer DEFAULT 0 NOT NULL,
    "comments" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."fan_posts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."fan_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "key" "text" NOT NULL,
    "value" "jsonb",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."feature_flags" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fund_donations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" integer,
    "status" "text" DEFAULT 'pending'::"text",
    CONSTRAINT "fund_donations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'failed'::"text"])))
);

ALTER TABLE ONLY "public"."fund_donations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."fund_donations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fund_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "goal" integer,
    "progress" integer DEFAULT 0
);

ALTER TABLE ONLY "public"."fund_projects" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."fund_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gamification_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "kind" "text",
    "value" integer,
    "context" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."gamification_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."gamification_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboards" (
    "period" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "points" integer
);

ALTER TABLE ONLY "public"."leaderboards" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."match_gates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "max_throughput" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."match_gates" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_gates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."match_zones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "capacity" integer DEFAULT 0 NOT NULL,
    "price" integer DEFAULT 0 NOT NULL,
    "default_gate" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."match_zones" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_zones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kickoff" timestamp with time zone NOT NULL,
    "venue" "text",
    "status" "public"."match_status" DEFAULT 'upcoming'::"public"."match_status" NOT NULL,
    "vip_price" integer,
    "regular_price" integer,
    "seats_vip" integer,
    "seats_regular" integer,
    "blue_price" integer,
    "seats_blue" integer,
    "opponent" "text"
);

ALTER TABLE ONLY "public"."matches" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."membership_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "price" integer,
    "perks" "jsonb" DEFAULT '[]'::"jsonb"
);

ALTER TABLE ONLY "public"."membership_plans" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "started_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    CONSTRAINT "memberships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'pending'::"text"])))
);

ALTER TABLE ONLY "public"."memberships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "qty" integer NOT NULL,
    "price" integer NOT NULL
);

ALTER TABLE ONLY "public"."order_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "description" "text"
);

ALTER TABLE ONLY "public"."permissions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid",
    "number" "text" NOT NULL,
    "valid_from" timestamp with time zone NOT NULL,
    "valid_to" timestamp with time zone NOT NULL,
    "free_ticket_issued" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."policies" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."polls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "results" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "active" boolean DEFAULT true NOT NULL
);

ALTER TABLE ONLY "public"."polls" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."polls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "price" integer,
    "stock" integer DEFAULT 0,
    "images" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products_legacy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "price" integer,
    "stock" integer DEFAULT 0,
    "images" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."products_legacy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "phone" "text",
    "momo_number" "text",
    "avatar_url" "text",
    "tier" "public"."user_tier" DEFAULT 'guest'::"public"."user_tier" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_name" "text",
    "region" "text",
    "fan_club" "text",
    "public_profile" boolean DEFAULT false,
    "language" "text" DEFAULT 'rw'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "user_code" "text"
);

ALTER TABLE ONLY "public"."users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_members" AS
 SELECT "id",
    COALESCE("display_name", "name", 'Fan'::"text") AS "display_name",
    COALESCE("region", '—'::"text") AS "region",
    COALESCE("fan_club", '—'::"text") AS "fan_club",
    "joined_at",
    COALESCE("avatar_url", ''::"text") AS "avatar_url"
   FROM "public"."users"
  WHERE (COALESCE("public_profile", false) IS TRUE);


ALTER VIEW "public"."public_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "source" "text" NOT NULL,
    "ref_id" "uuid",
    "points" integer NOT NULL,
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rewards_events_source_check" CHECK (("source" = ANY (ARRAY['transaction'::"text", 'policy_perk'::"text"])))
);

ALTER TABLE ONLY "public"."rewards_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."roles_permissions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "price" integer NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "image_url" "text",
    "badge" "text",
    "images" "jsonb" DEFAULT '[]'::"jsonb"
);

ALTER TABLE ONLY "public"."shop_products" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_promotions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "discount_pct" numeric,
    "product_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "shop_promotions_discount_pct_check" CHECK ((("discount_pct" > (0)::numeric) AND ("discount_pct" <= (90)::numeric)))
);

ALTER TABLE ONLY "public"."shop_promotions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_promotions" OWNER TO "postgres";


COMMENT ON TABLE "public"."shop_promotions" IS 'Admin-defined sales windows and bundles';



CREATE TABLE IF NOT EXISTS "public"."ticket_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "zone" "public"."ticket_zone" NOT NULL,
    "quantity" integer NOT NULL,
    "price" integer NOT NULL
);

ALTER TABLE ONLY "public"."ticket_order_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "match_id" "uuid",
    "zone" "text" NOT NULL,
    "price" integer NOT NULL,
    "paid" boolean DEFAULT false,
    "momo_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tickets_zone_check" CHECK (("zone" = ANY (ARRAY['VIP'::"text", 'Regular'::"text", 'Blue'::"text"])))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets_legacy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "match_id" "uuid",
    "zone" "public"."ticket_zone" NOT NULL,
    "price" integer NOT NULL,
    "paid" boolean DEFAULT false NOT NULL,
    "momo_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_id" "uuid",
    "gate" "text",
    "state" "text" DEFAULT 'pending'::"text" NOT NULL,
    "qr_token" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tickets_legacy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "kind" "text",
    "amount" integer NOT NULL,
    "ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transactions_kind_check" CHECK (("kind" = ANY (ARRAY['deposit'::"text", 'purchase'::"text", 'refund'::"text", 'reward'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions_legacy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "public"."transaction_type" NOT NULL,
    "amount" integer NOT NULL,
    "ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."transaction_status" DEFAULT 'pending'::"public"."transaction_status" NOT NULL
);


ALTER TABLE "public"."transactions_legacy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."translations" (
    "lang" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."translations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_favorites_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['team'::"text", 'player'::"text", 'competition'::"text"])))
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_prefs" (
    "user_id" "uuid" NOT NULL,
    "language" "text" DEFAULT 'rw'::"text",
    "notifications" "jsonb" DEFAULT '{"club": true, "final": true, "goals": true, "kickoff": true}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_prefs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "balance" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."wallet" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "balance" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."AdminAction"
    ADD CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AdminRole"
    ADD CONSTRAINT "AdminRole_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."AdminRole"
    ADD CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AdminSession"
    ADD CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AdminUser"
    ADD CONSTRAINT "AdminUser_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."AdminUser"
    ADD CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AdminUsersOnRoles"
    ADD CONSTRAINT "AdminUsersOnRoles_pkey" PRIMARY KEY ("adminUserId", "roleId");



ALTER TABLE ONLY "public"."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."FanClubMember"
    ADD CONSTRAINT "FanClubMember_pkey" PRIMARY KEY ("fanClubId", "userId");



ALTER TABLE ONLY "public"."FanClub"
    ADD CONSTRAINT "FanClub_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."FanSession"
    ADD CONSTRAINT "FanSession_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."FeatureFlag"
    ADD CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."FundDonation"
    ADD CONSTRAINT "FundDonation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."FundProject"
    ADD CONSTRAINT "FundProject_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."GamificationEvent"
    ADD CONSTRAINT "GamificationEvent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."GateScan"
    ADD CONSTRAINT "GateScan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Leaderboard"
    ADD CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("period", "userId");



ALTER TABLE ONLY "public"."MatchGate"
    ADD CONSTRAINT "MatchGate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Match"
    ADD CONSTRAINT "Match_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."Membership"
    ADD CONSTRAINT "Membership_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Permission"
    ADD CONSTRAINT "Permission_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PollOption"
    ADD CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PollVote"
    ADD CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Poll"
    ADD CONSTRAINT "Poll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PostReaction"
    ADD CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("postId", "userId");



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PredictionFixture"
    ADD CONSTRAINT "PredictionFixture_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Product"
    ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."Quiz"
    ADD CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");



ALTER TABLE ONLY "public"."SmsParsed"
    ADD CONSTRAINT "SmsParsed_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SmsParsed"
    ADD CONSTRAINT "SmsParsed_smsId_key" UNIQUE ("smsId");



ALTER TABLE ONLY "public"."SmsParserPrompt"
    ADD CONSTRAINT "SmsParserPrompt_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."SmsParserPrompt"
    ADD CONSTRAINT "SmsParserPrompt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SmsRaw"
    ADD CONSTRAINT "SmsRaw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketOrderItem"
    ADD CONSTRAINT "TicketOrderItem_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketOrder"
    ADD CONSTRAINT "TicketOrder_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketPass"
    ADD CONSTRAINT "TicketPass_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketPass"
    ADD CONSTRAINT "TicketPass_qrTokenHash_key" UNIQUE ("qrTokenHash");



ALTER TABLE ONLY "public"."TicketZone"
    ADD CONSTRAINT "TicketZone_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Translation"
    ADD CONSTRAINT "Translation_pkey" PRIMARY KEY ("lang", "key");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UssdTemplate"
    ADD CONSTRAINT "UssdTemplate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users_roles"
    ADD CONSTRAINT "admin_users_roles_pkey" PRIMARY KEY ("admin_user_id", "role_id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."fan_clubs"
    ADD CONSTRAINT "fan_clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fan_posts"
    ADD CONSTRAINT "fan_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."fund_donations"
    ADD CONSTRAINT "fund_donations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fund_projects"
    ADD CONSTRAINT "fund_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gamification_events"
    ADD CONSTRAINT "gamification_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_quotes"
    ADD CONSTRAINT "insurance_quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("period", "user_id");



ALTER TABLE ONLY "public"."match_gates"
    ADD CONSTRAINT "match_gates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_zones"
    ADD CONSTRAINT "match_zones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_plans"
    ADD CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."polls"
    ADD CONSTRAINT "polls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products_legacy"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards_events"
    ADD CONSTRAINT "rewards_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."sacco_deposits"
    ADD CONSTRAINT "sacco_deposits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_products"
    ADD CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_promotions"
    ADD CONSTRAINT "shop_promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_parsed"
    ADD CONSTRAINT "sms_parsed_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_raw"
    ADD CONSTRAINT "sms_raw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_order_items"
    ADD CONSTRAINT "ticket_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_orders"
    ADD CONSTRAINT "ticket_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_passes"
    ADD CONSTRAINT "ticket_passes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets_legacy"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions_legacy"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."translations"
    ADD CONSTRAINT "translations_pkey" PRIMARY KEY ("lang", "key");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_prefs"
    ADD CONSTRAINT "user_prefs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet"
    ADD CONSTRAINT "wallet_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet"
    ADD CONSTRAINT "wallet_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");



CREATE INDEX "FanSession_userId_revoked_idx" ON "public"."FanSession" USING "btree" ("userId", "revoked");



CREATE UNIQUE INDEX "Poll_postId_key" ON "public"."Poll" USING "btree" ("postId");



CREATE INDEX "idx_admin_session_user_revoked" ON "public"."AdminSession" USING "btree" ("adminUserId", "revoked");



CREATE INDEX "idx_audit_admin_at" ON "public"."AuditLog" USING "btree" ("adminUserId", "at");



CREATE INDEX "idx_audit_entity" ON "public"."AuditLog" USING "btree" ("entityType", "entityId");



CREATE INDEX "idx_gate_scan_created" ON "public"."GateScan" USING "btree" ("createdAt");



CREATE INDEX "idx_gate_scan_pass" ON "public"."GateScan" USING "btree" ("passId");



CREATE UNIQUE INDEX "idx_match_gate_unique" ON "public"."MatchGate" USING "btree" ("matchId", "name");



CREATE INDEX "idx_orders_created" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_payments_kind" ON "public"."payments" USING "btree" ("kind");



CREATE INDEX "idx_payments_status" ON "public"."Payment" USING "btree" ("status");



CREATE INDEX "idx_prediction_fixture_deadline" ON "public"."PredictionFixture" USING "btree" ("deadline");



CREATE INDEX "idx_promotions_active" ON "public"."shop_promotions" USING "btree" ("starts_at", "ends_at");



CREATE INDEX "idx_shop_products_category" ON "public"."shop_products" USING "btree" ("category");



CREATE INDEX "idx_sms_parsed_amount" ON "public"."sms_parsed" USING "btree" ("amount");



CREATE INDEX "idx_sms_parser_prompt_active" ON "public"."SmsParserPrompt" USING "btree" ("isActive");



CREATE INDEX "idx_sms_raw_received" ON "public"."sms_raw" USING "btree" ("received_at" DESC);



CREATE INDEX "idx_ticket_orders_created" ON "public"."TicketOrder" USING "btree" ("createdAt");



CREATE INDEX "idx_ticket_orders_match" ON "public"."ticket_orders" USING "btree" ("match_id");



CREATE INDEX "idx_ticket_orders_status" ON "public"."TicketOrder" USING "btree" ("status");



CREATE INDEX "idx_ticket_pass_transfer_token" ON "public"."TicketPass" USING "btree" ("transferTokenHash");



CREATE INDEX "idx_ticket_passes_order" ON "public"."ticket_passes" USING "btree" ("order_id");



CREATE UNIQUE INDEX "idx_ticket_zone_unique" ON "public"."TicketZone" USING "btree" ("matchId", "name");



CREATE INDEX "idx_ussd_template_telco_active" ON "public"."UssdTemplate" USING "btree" ("telco", "isActive");



CREATE UNIQUE INDEX "users_user_code_key" ON "public"."users" USING "btree" ("user_code") WHERE ("user_code" IS NOT NULL);



CREATE OR REPLACE TRIGGER "ticket_updated_at" BEFORE UPDATE ON "public"."tickets_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."touch_ticket_updated_at"();



CREATE OR REPLACE TRIGGER "trg_rewards_on_transactions" AFTER INSERT ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."award_points_on_transaction"();



CREATE OR REPLACE TRIGGER "trg_rewards_on_transactions" AFTER INSERT ON "public"."transactions_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."award_points_on_transaction"();



CREATE OR REPLACE TRIGGER "wallet_updated_at" BEFORE UPDATE ON "public"."wallet" FOR EACH ROW EXECUTE FUNCTION "public"."touch_wallet_updated_at"();



ALTER TABLE ONLY "public"."AdminAction"
    ADD CONSTRAINT "AdminAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."AdminSession"
    ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "public"."AdminUser"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."AdminUsersOnRoles"
    ADD CONSTRAINT "AdminUsersOnRoles_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "public"."AdminUser"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."AdminUsersOnRoles"
    ADD CONSTRAINT "AdminUsersOnRoles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."AdminRole"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."AuditLog"
    ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "public"."AdminUser"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."FanClubMember"
    ADD CONSTRAINT "FanClubMember_fanClubId_fkey" FOREIGN KEY ("fanClubId") REFERENCES "public"."FanClub"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."FanClubMember"
    ADD CONSTRAINT "FanClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."FanSession"
    ADD CONSTRAINT "FanSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."FeatureFlag"
    ADD CONSTRAINT "FeatureFlag_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."AdminUser"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."FundDonation"
    ADD CONSTRAINT "FundDonation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."FundProject"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."FundDonation"
    ADD CONSTRAINT "FundDonation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."GamificationEvent"
    ADD CONSTRAINT "GamificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."GateScan"
    ADD CONSTRAINT "GateScan_passId_fkey" FOREIGN KEY ("passId") REFERENCES "public"."TicketPass"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Leaderboard"
    ADD CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."MatchGate"
    ADD CONSTRAINT "MatchGate_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Membership"
    ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."MembershipPlan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Membership"
    ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Payment"
    ADD CONSTRAINT "Payment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "public"."FundDonation"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Payment"
    ADD CONSTRAINT "Payment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."Membership"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."TicketOrder"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Payment"
    ADD CONSTRAINT "Payment_smsParsedId_fkey" FOREIGN KEY ("smsParsedId") REFERENCES "public"."SmsParsed"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."PollOption"
    ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."Poll"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PollVote"
    ADD CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."PollOption"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PollVote"
    ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."Poll"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PollVote"
    ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Poll"
    ADD CONSTRAINT "Poll_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Poll"
    ADD CONSTRAINT "Poll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."PostReaction"
    ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PostReaction"
    ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PredictionFixture"
    ADD CONSTRAINT "PredictionFixture_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."AdminRole"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."SmsParsed"
    ADD CONSTRAINT "SmsParsed_smsId_fkey" FOREIGN KEY ("smsId") REFERENCES "public"."SmsRaw"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."SmsParserPrompt"
    ADD CONSTRAINT "SmsParserPrompt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."AdminUser"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TicketOrderItem"
    ADD CONSTRAINT "TicketOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."TicketOrder"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketOrder"
    ADD CONSTRAINT "TicketOrder_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketOrder"
    ADD CONSTRAINT "TicketOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TicketPass"
    ADD CONSTRAINT "TicketPass_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."TicketOrder"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketPass"
    ADD CONSTRAINT "TicketPass_transferredToUserId_fkey" FOREIGN KEY ("transferredToUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TicketZone"
    ADD CONSTRAINT "TicketZone_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Translation"
    ADD CONSTRAINT "Translation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."AdminUser"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."UssdTemplate"
    ADD CONSTRAINT "UssdTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."AdminUser"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users_roles"
    ADD CONSTRAINT "admin_users_roles_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users_roles"
    ADD CONSTRAINT "admin_users_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fan_posts"
    ADD CONSTRAINT "fan_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."insurance_quotes"
    ADD CONSTRAINT "insurance_quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_gates"
    ADD CONSTRAINT "match_gates_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_zones"
    ADD CONSTRAINT "match_zones_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."shop_products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_sms_parsed_id_fkey" FOREIGN KEY ("sms_parsed_id") REFERENCES "public"."sms_parsed"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_ticket_order_id_fkey" FOREIGN KEY ("ticket_order_id") REFERENCES "public"."ticket_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."insurance_quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rewards_events"
    ADD CONSTRAINT "rewards_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sacco_deposits"
    ADD CONSTRAINT "sacco_deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sms_parsed"
    ADD CONSTRAINT "sms_parsed_sms_id_fkey" FOREIGN KEY ("sms_id") REFERENCES "public"."sms_raw"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_order_items"
    ADD CONSTRAINT "ticket_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ticket_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_passes"
    ADD CONSTRAINT "ticket_passes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ticket_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets_legacy"
    ADD CONSTRAINT "tickets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_match_id_fkey1" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets_legacy"
    ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ticket_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets_legacy"
    ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions_legacy"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."translations"
    ADD CONSTRAINT "translations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_prefs"
    ADD CONSTRAINT "user_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet"
    ADD CONSTRAINT "wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."AdminAction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."AdminRole" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."AdminSession" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."AdminUser" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."AdminUsersOnRoles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."AuditLog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."FanClub" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."FanClubMember" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."FanSession" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."FeatureFlag" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."FundDonation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."FundProject" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."GamificationEvent" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."GateScan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Leaderboard" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Match" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."MatchGate" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Membership" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."MembershipPlan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."OrderItem" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Payment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Permission" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Poll" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PollOption" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PollVote" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Post" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PostReaction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PredictionFixture" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Product" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Quiz" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."RolePermission" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."SmsParsed" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."SmsParserPrompt" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."SmsRaw" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."TicketOrder" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."TicketOrderItem" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."TicketPass" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."TicketZone" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Translation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."UssdTemplate" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_all" ON "public"."AdminAction" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."AdminRole" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."AdminSession" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."AdminUser" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."AdminUsersOnRoles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."AuditLog" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."FanClub" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."FanClubMember" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."FanSession" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."FeatureFlag" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."FundDonation" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."FundProject" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."GamificationEvent" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."GateScan" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Leaderboard" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Match" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."MatchGate" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Membership" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."MembershipPlan" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Order" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."OrderItem" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Payment" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Permission" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Poll" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."PollOption" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."PollVote" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Post" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."PostReaction" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."PredictionFixture" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Product" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Quiz" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."RolePermission" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."SmsParsed" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."SmsParserPrompt" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."SmsRaw" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."TicketOrder" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."TicketOrderItem" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."TicketPass" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."TicketZone" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."Translation" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."User" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."UssdTemplate" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."_prisma_migrations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."admin_roles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."admin_sessions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."admin_users" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."admin_users_roles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."audit_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."fan_clubs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."fan_posts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."feature_flags" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."fund_donations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."fund_projects" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."gamification_events" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."insurance_quotes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."leaderboards" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."match_gates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."match_zones" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."matches" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."membership_plans" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."memberships" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."order_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."orders" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."payments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."permissions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."policies" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."polls" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."products" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."products_legacy" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."rewards_events" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."roles_permissions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."sacco_deposits" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."shop_products" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."shop_promotions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."sms_parsed" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."sms_raw" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."ticket_order_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."ticket_orders" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."ticket_passes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."tickets" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."tickets_legacy" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."transactions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."transactions_legacy" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."translations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."users" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."wallet" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."wallets" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fan_clubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fan_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fund_donations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fund_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gamification_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_gates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_zones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "p_community_posts_insert_owner" ON "public"."community_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_community_posts_mutate_owner" ON "public"."community_posts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_community_posts_public_read" ON "public"."community_posts" FOR SELECT USING ((("status" = 'visible'::"text") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "p_community_reports_service_only" ON "public"."community_reports" USING (false) WITH CHECK (false);



CREATE POLICY "p_content_items_public_read" ON "public"."content_items" FOR SELECT USING (true);



CREATE POLICY "p_fan_clubs_public_select" ON "public"."fan_clubs" FOR SELECT USING (true);



CREATE POLICY "p_fan_posts_insert_owner" ON "public"."fan_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_fan_posts_mutate_owner" ON "public"."fan_posts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_fan_posts_owner_update" ON "public"."fan_posts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_fan_posts_owner_write" ON "public"."fan_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_fan_posts_public_read" ON "public"."fan_posts" FOR SELECT USING (true);



CREATE POLICY "p_fan_posts_public_select" ON "public"."fan_posts" FOR SELECT USING (true);



CREATE POLICY "p_fund_donations_insert_owner" ON "public"."fund_donations" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_fund_donations_mutate_owner" ON "public"."fund_donations" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_fund_donations_owner_select" ON "public"."fund_donations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_fund_donations_select_owner" ON "public"."fund_donations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_fund_projects_public_select" ON "public"."fund_projects" FOR SELECT USING (true);



CREATE POLICY "p_gamification_events_owner_select" ON "public"."gamification_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_gamification_events_select_owner" ON "public"."gamification_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_insurance_quotes_insert_owner" ON "public"."insurance_quotes" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_insurance_quotes_mutate_owner" ON "public"."insurance_quotes" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_insurance_quotes_owner_select" ON "public"."insurance_quotes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_insurance_quotes_select_owner" ON "public"."insurance_quotes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_leaderboards_public_read" ON "public"."leaderboards" FOR SELECT USING (true);



CREATE POLICY "p_leaderboards_public_select" ON "public"."leaderboards" FOR SELECT USING (true);



CREATE POLICY "p_matches_public_select" ON "public"."matches" FOR SELECT USING (true);



CREATE POLICY "p_matches_read" ON "public"."matches" FOR SELECT USING (true);



CREATE POLICY "p_membership_plans_public_select" ON "public"."membership_plans" FOR SELECT USING (true);



CREATE POLICY "p_memberships_mutate_owner" ON "public"."memberships" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_memberships_select_owner" ON "public"."memberships" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_order_items_select_owner" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_orders_insert_owner" ON "public"."orders" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_orders_mutate_owner" ON "public"."orders" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_orders_select_owner" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_payments_deny_clients" ON "public"."payments" USING (false) WITH CHECK (false);



CREATE POLICY "p_payments_owner_select" ON "public"."payments" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."ticket_orders" "o"
  WHERE (("o"."id" = "payments"."ticket_order_id") AND ("o"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."orders" "so"
  WHERE (("so"."id" = "payments"."order_id") AND ("so"."user_id" = "auth"."uid"()))))));



CREATE POLICY "p_policies_owner_select" ON "public"."policies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."insurance_quotes" "q"
  WHERE (("q"."id" = "policies"."quote_id") AND ("q"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_policies_select_owner" ON "public"."policies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."insurance_quotes" "q"
  WHERE (("q"."id" = "policies"."quote_id") AND ("q"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_polls_public_select" ON "public"."polls" FOR SELECT USING (COALESCE("active", true));



CREATE POLICY "p_products_read" ON "public"."shop_products" FOR SELECT USING (true);



CREATE POLICY "p_read_products" ON "public"."products_legacy" FOR SELECT USING (true);



CREATE POLICY "p_read_projects" ON "public"."fund_projects" FOR SELECT USING (true);



CREATE POLICY "p_rewards_events_owner_select" ON "public"."rewards_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_sacco_deposits_insert_owner" ON "public"."sacco_deposits" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_sacco_deposits_owner_select" ON "public"."sacco_deposits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_sacco_deposits_select_owner" ON "public"."sacco_deposits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_service_role_all" ON "public"."admin_roles" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."admin_sessions" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."admin_users" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."admin_users_roles" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."audit_logs" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."fan_clubs" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."fan_posts" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."feature_flags" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."fund_donations" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."fund_projects" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."gamification_events" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."insurance_quotes" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."leaderboards" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."match_gates" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."match_zones" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."matches" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."membership_plans" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."memberships" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."order_items" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."orders" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."payments" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."permissions" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."policies" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."polls" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."rewards_events" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."roles_permissions" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."sacco_deposits" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."shop_products" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."shop_promotions" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."sms_parsed" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."sms_raw" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."ticket_order_items" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."ticket_orders" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."ticket_passes" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."translations" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."users" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_service_role_all" ON "public"."wallet" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'service_role'::"text"));



CREATE POLICY "p_shop_products_public_select" ON "public"."shop_products" FOR SELECT USING (true);



CREATE POLICY "p_shop_promotions_public_select" ON "public"."shop_promotions" FOR SELECT USING ((("now"() >= ("starts_at" - '14 days'::interval)) AND ("now"() <= ("ends_at" + '14 days'::interval))));



CREATE POLICY "p_sms_parsed_service_only" ON "public"."sms_parsed" USING (false) WITH CHECK (false);



CREATE POLICY "p_sms_raw_service_only" ON "public"."sms_raw" USING (false) WITH CHECK (false);



CREATE POLICY "p_ticket_order_items_owner_select" ON "public"."ticket_order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ticket_orders" "o"
  WHERE (("o"."id" = "ticket_order_items"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_ticket_orders_insert_own" ON "public"."ticket_orders" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_ticket_orders_mutate_own" ON "public"."ticket_orders" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "p_ticket_orders_owner_insert" ON "public"."ticket_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_ticket_orders_owner_modify" ON "public"."ticket_orders" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_ticket_orders_owner_select" ON "public"."ticket_orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_ticket_orders_select_own" ON "public"."ticket_orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_ticket_passes_owner_select" ON "public"."ticket_passes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ticket_orders" "o"
  WHERE (("o"."id" = "ticket_passes"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_ticket_passes_select_own" ON "public"."ticket_passes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ticket_orders" "o"
  WHERE (("o"."id" = "ticket_passes"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_transactions_select_owner" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_user_favorites_insert_owner" ON "public"."user_favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_user_favorites_select_owner" ON "public"."user_favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_user_favorites_update_owner" ON "public"."user_favorites" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_user_prefs_insert_owner" ON "public"."user_prefs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_user_prefs_select_owner" ON "public"."user_prefs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_user_prefs_update_owner" ON "public"."user_prefs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "p_users_self_select" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "p_users_self_update" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "p_wallet_owner_select" ON "public"."wallet" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "p_wallets_select_owner" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."polls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products_legacy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sacco_deposits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_promotions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_parsed" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_raw" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_passes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets_legacy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions_legacy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_prefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."award_points_on_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."award_points_on_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_points_on_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_points"("p_user_id" "uuid", "p_points_delta" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_points"("p_user_id" "uuid", "p_points_delta" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_points"("p_user_id" "uuid", "p_points_delta" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."rewards_points_for"("kind" "text", "amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."rewards_points_for"("kind" "text", "amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rewards_points_for"("kind" "text", "amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_ticket_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_ticket_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_ticket_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_wallet_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_wallet_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_wallet_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."AdminAction" TO "anon";
GRANT ALL ON TABLE "public"."AdminAction" TO "authenticated";
GRANT ALL ON TABLE "public"."AdminAction" TO "service_role";



GRANT ALL ON TABLE "public"."AdminRole" TO "anon";
GRANT ALL ON TABLE "public"."AdminRole" TO "authenticated";
GRANT ALL ON TABLE "public"."AdminRole" TO "service_role";



GRANT ALL ON TABLE "public"."AdminSession" TO "anon";
GRANT ALL ON TABLE "public"."AdminSession" TO "authenticated";
GRANT ALL ON TABLE "public"."AdminSession" TO "service_role";



GRANT ALL ON TABLE "public"."AdminUser" TO "anon";
GRANT ALL ON TABLE "public"."AdminUser" TO "authenticated";
GRANT ALL ON TABLE "public"."AdminUser" TO "service_role";



GRANT ALL ON TABLE "public"."AdminUsersOnRoles" TO "anon";
GRANT ALL ON TABLE "public"."AdminUsersOnRoles" TO "authenticated";
GRANT ALL ON TABLE "public"."AdminUsersOnRoles" TO "service_role";



GRANT ALL ON TABLE "public"."AuditLog" TO "anon";
GRANT ALL ON TABLE "public"."AuditLog" TO "authenticated";
GRANT ALL ON TABLE "public"."AuditLog" TO "service_role";



GRANT ALL ON TABLE "public"."FanClub" TO "anon";
GRANT ALL ON TABLE "public"."FanClub" TO "authenticated";
GRANT ALL ON TABLE "public"."FanClub" TO "service_role";



GRANT ALL ON TABLE "public"."FanClubMember" TO "anon";
GRANT ALL ON TABLE "public"."FanClubMember" TO "authenticated";
GRANT ALL ON TABLE "public"."FanClubMember" TO "service_role";



GRANT ALL ON TABLE "public"."FanSession" TO "anon";
GRANT ALL ON TABLE "public"."FanSession" TO "authenticated";
GRANT ALL ON TABLE "public"."FanSession" TO "service_role";



GRANT ALL ON TABLE "public"."FeatureFlag" TO "anon";
GRANT ALL ON TABLE "public"."FeatureFlag" TO "authenticated";
GRANT ALL ON TABLE "public"."FeatureFlag" TO "service_role";



GRANT ALL ON TABLE "public"."FundDonation" TO "anon";
GRANT ALL ON TABLE "public"."FundDonation" TO "authenticated";
GRANT ALL ON TABLE "public"."FundDonation" TO "service_role";



GRANT ALL ON TABLE "public"."FundProject" TO "anon";
GRANT ALL ON TABLE "public"."FundProject" TO "authenticated";
GRANT ALL ON TABLE "public"."FundProject" TO "service_role";



GRANT ALL ON TABLE "public"."GamificationEvent" TO "anon";
GRANT ALL ON TABLE "public"."GamificationEvent" TO "authenticated";
GRANT ALL ON TABLE "public"."GamificationEvent" TO "service_role";



GRANT ALL ON TABLE "public"."GateScan" TO "anon";
GRANT ALL ON TABLE "public"."GateScan" TO "authenticated";
GRANT ALL ON TABLE "public"."GateScan" TO "service_role";



GRANT ALL ON TABLE "public"."Leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."Leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."Leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."Match" TO "anon";
GRANT ALL ON TABLE "public"."Match" TO "authenticated";
GRANT ALL ON TABLE "public"."Match" TO "service_role";



GRANT ALL ON TABLE "public"."MatchGate" TO "anon";
GRANT ALL ON TABLE "public"."MatchGate" TO "authenticated";
GRANT ALL ON TABLE "public"."MatchGate" TO "service_role";



GRANT ALL ON TABLE "public"."Membership" TO "anon";
GRANT ALL ON TABLE "public"."Membership" TO "authenticated";
GRANT ALL ON TABLE "public"."Membership" TO "service_role";



GRANT ALL ON TABLE "public"."MembershipPlan" TO "anon";
GRANT ALL ON TABLE "public"."MembershipPlan" TO "authenticated";
GRANT ALL ON TABLE "public"."MembershipPlan" TO "service_role";



GRANT ALL ON TABLE "public"."Order" TO "anon";
GRANT ALL ON TABLE "public"."Order" TO "authenticated";
GRANT ALL ON TABLE "public"."Order" TO "service_role";



GRANT ALL ON TABLE "public"."OrderItem" TO "anon";
GRANT ALL ON TABLE "public"."OrderItem" TO "authenticated";
GRANT ALL ON TABLE "public"."OrderItem" TO "service_role";



GRANT ALL ON TABLE "public"."Payment" TO "anon";
GRANT ALL ON TABLE "public"."Payment" TO "authenticated";
GRANT ALL ON TABLE "public"."Payment" TO "service_role";



GRANT ALL ON TABLE "public"."Permission" TO "anon";
GRANT ALL ON TABLE "public"."Permission" TO "authenticated";
GRANT ALL ON TABLE "public"."Permission" TO "service_role";



GRANT ALL ON TABLE "public"."Poll" TO "anon";
GRANT ALL ON TABLE "public"."Poll" TO "authenticated";
GRANT ALL ON TABLE "public"."Poll" TO "service_role";



GRANT ALL ON TABLE "public"."PollOption" TO "anon";
GRANT ALL ON TABLE "public"."PollOption" TO "authenticated";
GRANT ALL ON TABLE "public"."PollOption" TO "service_role";



GRANT ALL ON TABLE "public"."PollVote" TO "anon";
GRANT ALL ON TABLE "public"."PollVote" TO "authenticated";
GRANT ALL ON TABLE "public"."PollVote" TO "service_role";



GRANT ALL ON TABLE "public"."Post" TO "anon";
GRANT ALL ON TABLE "public"."Post" TO "authenticated";
GRANT ALL ON TABLE "public"."Post" TO "service_role";



GRANT ALL ON TABLE "public"."PostReaction" TO "anon";
GRANT ALL ON TABLE "public"."PostReaction" TO "authenticated";
GRANT ALL ON TABLE "public"."PostReaction" TO "service_role";



GRANT ALL ON TABLE "public"."PredictionFixture" TO "anon";
GRANT ALL ON TABLE "public"."PredictionFixture" TO "authenticated";
GRANT ALL ON TABLE "public"."PredictionFixture" TO "service_role";



GRANT ALL ON TABLE "public"."Product" TO "anon";
GRANT ALL ON TABLE "public"."Product" TO "authenticated";
GRANT ALL ON TABLE "public"."Product" TO "service_role";



GRANT ALL ON TABLE "public"."Quiz" TO "anon";
GRANT ALL ON TABLE "public"."Quiz" TO "authenticated";
GRANT ALL ON TABLE "public"."Quiz" TO "service_role";



GRANT ALL ON TABLE "public"."RolePermission" TO "anon";
GRANT ALL ON TABLE "public"."RolePermission" TO "authenticated";
GRANT ALL ON TABLE "public"."RolePermission" TO "service_role";



GRANT ALL ON TABLE "public"."SmsParsed" TO "anon";
GRANT ALL ON TABLE "public"."SmsParsed" TO "authenticated";
GRANT ALL ON TABLE "public"."SmsParsed" TO "service_role";



GRANT ALL ON TABLE "public"."SmsParserPrompt" TO "anon";
GRANT ALL ON TABLE "public"."SmsParserPrompt" TO "authenticated";
GRANT ALL ON TABLE "public"."SmsParserPrompt" TO "service_role";



GRANT ALL ON TABLE "public"."SmsRaw" TO "anon";
GRANT ALL ON TABLE "public"."SmsRaw" TO "authenticated";
GRANT ALL ON TABLE "public"."SmsRaw" TO "service_role";



GRANT ALL ON TABLE "public"."TicketOrder" TO "anon";
GRANT ALL ON TABLE "public"."TicketOrder" TO "authenticated";
GRANT ALL ON TABLE "public"."TicketOrder" TO "service_role";



GRANT ALL ON TABLE "public"."TicketOrderItem" TO "anon";
GRANT ALL ON TABLE "public"."TicketOrderItem" TO "authenticated";
GRANT ALL ON TABLE "public"."TicketOrderItem" TO "service_role";



GRANT ALL ON TABLE "public"."TicketPass" TO "anon";
GRANT ALL ON TABLE "public"."TicketPass" TO "authenticated";
GRANT ALL ON TABLE "public"."TicketPass" TO "service_role";



GRANT ALL ON TABLE "public"."TicketZone" TO "anon";
GRANT ALL ON TABLE "public"."TicketZone" TO "authenticated";
GRANT ALL ON TABLE "public"."TicketZone" TO "service_role";



GRANT ALL ON TABLE "public"."Translation" TO "anon";
GRANT ALL ON TABLE "public"."Translation" TO "authenticated";
GRANT ALL ON TABLE "public"."Translation" TO "service_role";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";



GRANT ALL ON TABLE "public"."UssdTemplate" TO "anon";
GRANT ALL ON TABLE "public"."UssdTemplate" TO "authenticated";
GRANT ALL ON TABLE "public"."UssdTemplate" TO "service_role";



GRANT ALL ON TABLE "public"."_prisma_migrations" TO "anon";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_passes" TO "anon";
GRANT ALL ON TABLE "public"."ticket_passes" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_passes" TO "service_role";



GRANT ALL ON TABLE "public"."admin_dashboard_gate_throughput" TO "anon";
GRANT ALL ON TABLE "public"."admin_dashboard_gate_throughput" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_dashboard_gate_throughput" TO "service_role";



GRANT ALL ON TABLE "public"."insurance_quotes" TO "anon";
GRANT ALL ON TABLE "public"."insurance_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."insurance_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."sacco_deposits" TO "anon";
GRANT ALL ON TABLE "public"."sacco_deposits" TO "authenticated";
GRANT ALL ON TABLE "public"."sacco_deposits" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_orders" TO "anon";
GRANT ALL ON TABLE "public"."ticket_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_orders" TO "service_role";



GRANT ALL ON TABLE "public"."admin_dashboard_kpis" TO "anon";
GRANT ALL ON TABLE "public"."admin_dashboard_kpis" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_dashboard_kpis" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."admin_dashboard_payment_metrics" TO "anon";
GRANT ALL ON TABLE "public"."admin_dashboard_payment_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_dashboard_payment_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."sms_parsed" TO "anon";
GRANT ALL ON TABLE "public"."sms_parsed" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_parsed" TO "service_role";



GRANT ALL ON TABLE "public"."sms_raw" TO "anon";
GRANT ALL ON TABLE "public"."sms_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_raw" TO "service_role";



GRANT ALL ON TABLE "public"."admin_dashboard_sms_metrics" TO "anon";
GRANT ALL ON TABLE "public"."admin_dashboard_sms_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_dashboard_sms_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."admin_roles" TO "anon";
GRANT ALL ON TABLE "public"."admin_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_roles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_sessions" TO "anon";
GRANT ALL ON TABLE "public"."admin_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users_roles" TO "anon";
GRANT ALL ON TABLE "public"."admin_users_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users_roles" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."community_reports" TO "anon";
GRANT ALL ON TABLE "public"."community_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."community_reports" TO "service_role";



GRANT ALL ON TABLE "public"."content_items" TO "anon";
GRANT ALL ON TABLE "public"."content_items" TO "authenticated";
GRANT ALL ON TABLE "public"."content_items" TO "service_role";



GRANT ALL ON TABLE "public"."fan_clubs" TO "anon";
GRANT ALL ON TABLE "public"."fan_clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."fan_clubs" TO "service_role";



GRANT ALL ON TABLE "public"."fan_posts" TO "anon";
GRANT ALL ON TABLE "public"."fan_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."fan_posts" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."fund_donations" TO "anon";
GRANT ALL ON TABLE "public"."fund_donations" TO "authenticated";
GRANT ALL ON TABLE "public"."fund_donations" TO "service_role";



GRANT ALL ON TABLE "public"."fund_projects" TO "anon";
GRANT ALL ON TABLE "public"."fund_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."fund_projects" TO "service_role";



GRANT ALL ON TABLE "public"."gamification_events" TO "anon";
GRANT ALL ON TABLE "public"."gamification_events" TO "authenticated";
GRANT ALL ON TABLE "public"."gamification_events" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboards" TO "anon";
GRANT ALL ON TABLE "public"."leaderboards" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboards" TO "service_role";



GRANT ALL ON TABLE "public"."match_gates" TO "anon";
GRANT ALL ON TABLE "public"."match_gates" TO "authenticated";
GRANT ALL ON TABLE "public"."match_gates" TO "service_role";



GRANT ALL ON TABLE "public"."match_zones" TO "anon";
GRANT ALL ON TABLE "public"."match_zones" TO "authenticated";
GRANT ALL ON TABLE "public"."match_zones" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."membership_plans" TO "anon";
GRANT ALL ON TABLE "public"."membership_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_plans" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."policies" TO "anon";
GRANT ALL ON TABLE "public"."policies" TO "authenticated";
GRANT ALL ON TABLE "public"."policies" TO "service_role";



GRANT ALL ON TABLE "public"."polls" TO "anon";
GRANT ALL ON TABLE "public"."polls" TO "authenticated";
GRANT ALL ON TABLE "public"."polls" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."products_legacy" TO "anon";
GRANT ALL ON TABLE "public"."products_legacy" TO "authenticated";
GRANT ALL ON TABLE "public"."products_legacy" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."public_members" TO "anon";
GRANT ALL ON TABLE "public"."public_members" TO "authenticated";
GRANT ALL ON TABLE "public"."public_members" TO "service_role";



GRANT ALL ON TABLE "public"."rewards_events" TO "anon";
GRANT ALL ON TABLE "public"."rewards_events" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards_events" TO "service_role";



GRANT ALL ON TABLE "public"."roles_permissions" TO "anon";
GRANT ALL ON TABLE "public"."roles_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."roles_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."shop_products" TO "anon";
GRANT ALL ON TABLE "public"."shop_products" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_products" TO "service_role";



GRANT ALL ON TABLE "public"."shop_promotions" TO "anon";
GRANT ALL ON TABLE "public"."shop_promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_promotions" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_order_items" TO "anon";
GRANT ALL ON TABLE "public"."ticket_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."tickets_legacy" TO "anon";
GRANT ALL ON TABLE "public"."tickets_legacy" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets_legacy" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_legacy" TO "anon";
GRANT ALL ON TABLE "public"."transactions_legacy" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_legacy" TO "service_role";



GRANT ALL ON TABLE "public"."translations" TO "anon";
GRANT ALL ON TABLE "public"."translations" TO "authenticated";
GRANT ALL ON TABLE "public"."translations" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorites" TO "anon";
GRANT ALL ON TABLE "public"."user_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."user_prefs" TO "anon";
GRANT ALL ON TABLE "public"."user_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."wallet" TO "anon";
GRANT ALL ON TABLE "public"."wallet" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
