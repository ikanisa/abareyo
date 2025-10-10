Title: Phase 1 — Admin Features: dashboards + admin endpoints (fundraising, membership, shop, reports)

Summary

- Adds admin dashboards for Fundraising, Membership, and Shop under Next.js App Router.
- Implements backend admin controllers/services for the corresponding domains and a Reports overview endpoint.
- Wires row-level actions for common operations (status changes, notes, tracking, plan/member updates) via shadcn DataTable.
- Extends seed permissions to cover new guards and aligns FE clients to admin endpoints.

Frontend

- Pages
  - app/admin/(dashboard)/fundraising/page.tsx — summary, projects list, donations table + actions
  - app/admin/(dashboard)/membership/page.tsx — plans list, members table + actions
  - app/admin/(dashboard)/shop/page.tsx — shop KPIs, orders manage table + actions
- Components (client)
  - src/components/admin/fundraising/FundraisingActions.tsx
  - src/components/admin/fundraising/FundraisingDonationsTable.tsx
  - src/components/admin/membership/MembershipActions.tsx
  - src/components/admin/membership/MembersTable.tsx
  - src/components/admin/shop/ShopActions.tsx
  - src/components/admin/shop/ShopOrdersManageTable.tsx

Backend (NestJS)

- Admin controllers/services
  - Fundraising: admin-fundraising.controller.ts, admin-fundraising.service.ts
    - GET /api/admin/fundraising/summary
    - GET /api/admin/fundraising/projects
    - POST /api/admin/fundraising/projects
    - GET /api/admin/fundraising/donations
    - POST /api/admin/fundraising/donations/:donationId/status
    - GET /api/admin/fundraising/donations/export
  - Membership: admin-membership.controller.ts, admin-membership.service.ts
    - GET /api/admin/membership/plans
    - POST /api/admin/membership/plans
    - GET /api/admin/membership/members
    - POST /api/admin/membership/members/:membershipId/status
  - Shop: admin-shop.controller.ts, admin-shop.service.ts
    - GET /api/admin/shop/summary
    - GET /api/admin/shop/orders
    - POST /api/admin/shop/orders/:orderId/status
    - POST /api/admin/shop/orders/:orderId/note
    - POST /api/admin/shop/orders/:orderId/tracking
    - POST /api/admin/shop/orders/status/batch
  - Reports: admin-reports.controller.ts, admin-reports.service.ts
    - GET /api/admin/reports/overview
- RBAC
  - Uses existing AdminSessionGuard + AdminPermissionsGuard
  - Seeded permissions updated for: membership:plan:view|update, membership:member:view|update, shop:order:view|update, fundraising:project:view|update, fundraising:donation:view|update, translation:view, reports:view

Validation steps

1) Seed (optional admin user + permissions)
   - In backend/: set envs and run
     - ADMIN_SEED_EMAIL=admin@example.com
     - ADMIN_SEED_PASSWORD_HASH=<bcrypt-hash>
     - ADMIN_SEED_NAME=System Admin
     - npm run seed

2) Run backend with required envs
   - CORS_ORIGIN, ADMIN_SESSION_SECRET, FAN_SESSION_SECRET, DATABASE_URL, REDIS_URL, METRICS_TOKEN

3) Login at /admin/login and validate:
   - Fundraising: donations table loads and status updates apply.
   - Membership: members table loads and status/auto‑renew edits persist.
   - Shop: orders table loads and status/note/tracking edits persist; batch updates via Actions section.

Notes

- Backend type-check currently fails due to pre-existing Fastify/contract type mismatches; not introduced by this PR. New admin modules follow existing module patterns and compile once global tsconfig/deps are aligned.
- Currency is displayed as stored (RWF integer units) across the admin.
- Follow-up: row-level actions for projects/plans CRUD UIs; add Playwright smokes.

Screens/traces

- Can include screenshots of each dashboard’s tables and action flows if helpful.

