-- Remove camelCase duplicates introduced by early Prisma scaffolding.
-- Canonical tables remain the snake_case variants managed via Supabase SQL.

-- Drop dependent tables first to avoid FK conflicts.
drop table if exists public."TicketOrderItem" cascade;
drop table if exists public."TicketPass" cascade;
drop table if exists public."TicketZone" cascade;
drop table if exists public."TicketOrder" cascade;
drop table if exists public."Payment" cascade;
drop table if exists public."OrderItem" cascade;
drop table if exists public."Order" cascade;
drop table if exists public."Product" cascade;
drop table if exists public."FundDonation" cascade;
drop table if exists public."FundProject" cascade;
drop table if exists public."GamificationEvent" cascade;
drop table if exists public."Leaderboard" cascade;
drop table if exists public."MatchGate" cascade;
drop table if exists public."GateScan" cascade;
drop table if exists public."Match" cascade;
drop table if exists public."PredictionFixture" cascade;
drop table if exists public."PollVote" cascade;
drop table if exists public."PollOption" cascade;
drop table if exists public."Poll" cascade;
drop table if exists public."PostReaction" cascade;
drop table if exists public."Post" cascade;
drop table if exists public."FanClubMember" cascade;
drop table if exists public."FanClub" cascade;
drop table if exists public."FanSession" cascade;
drop table if exists public."AdminAction" cascade;
drop table if exists public."AdminUsersOnRoles" cascade;
drop table if exists public."AdminSession" cascade;
drop table if exists public."AdminRole" cascade;
drop table if exists public."RolePermission" cascade;
drop table if exists public."Permission" cascade;
drop table if exists public."AdminUser" cascade;
drop table if exists public."AuditLog" cascade;
drop table if exists public."FeatureFlag" cascade;
drop table if exists public."Translation" cascade;
drop table if exists public."UssdTemplate" cascade;
drop table if exists public."SmsParserPrompt" cascade;
drop table if exists public."SmsParsed" cascade;
drop table if exists public."SmsRaw" cascade;
drop table if exists public."Quiz" cascade;
drop table if exists public."GamificationEvent" cascade;
drop table if exists public."User" cascade;

-- Remove camelCase enums that are no longer referenced.
drop type if exists public."TicketOrderStatus" cascade;
drop type if exists public."TicketPassState" cascade;
drop type if exists public."PaymentKind" cascade;
drop type if exists public."PaymentStatus" cascade;
drop type if exists public."SmsIngestStatus" cascade;
drop type if exists public."MembershipStatus" cascade;
drop type if exists public."GamificationKind" cascade;
drop type if exists public."LeaderboardPeriod" cascade;
drop type if exists public."MatchStatus" cascade;
