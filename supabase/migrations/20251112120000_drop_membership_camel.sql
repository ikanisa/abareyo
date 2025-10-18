-- Follow-up cleanup: remove remaining camelCase membership tables.
drop table if exists public."Membership" cascade;
drop table if exists public."MembershipPlan" cascade;
