# ADR-0001: Backend Platform Selection

## Status
Accepted – 2025-01-13

## Context
The Rayon Sports Fan PWA must support USSD-triggered purchases, GSM modem SMS ingestion, real-time match data, and admin tooling. Requirements include:
- Node.js runtime with structured modular boundaries (tickets, memberships, shop, fundraising, community, realtime).
- High throughput, low-latency WebSocket support for live match centre and QR token rotation.
- Rapid developer productivity with TypeScript, dependency injection, validation, and test tooling.
- Easy integration with OpenAI APIs and background queue processing.
- Future expansion to additional microservices if needed, without sacrificing monolithic simplicity for MVP.

Two options were under consideration:
1. **NestJS (Fastify adapter)** – opinionated architecture, DI container, module system, first-class validation/pipes, integrates cleanly with Prisma/TypeORM and WebSockets. Supports hybrid HTTP + WS, background queues, and existing team familiarity.
2. **Fastify (hand-rolled)** – lighter footprint, excellent performance, but would require bespoke module boundary definitions, DI, and testing scaffolding.

## Decision
Adopt **NestJS 11 with the Fastify adapter** as the backend framework.

Key supporting elements:
- Structured modules allow mirroring the existing information architecture (tickets, payments, sms, community, etc.).
- Built-in configuration management maps well to the required env var contract.
- Guards/interceptors ease future auth upgrades (external OTP hand-off now, richer auth later).
- Nest’s GraphQL option remains available if needed; initial release will use REST + WebSockets.
- Fastify adapter delivers the desired performance characteristics while keeping Nest ergonomics.

## Consequences
- Create a dedicated backend workspace under `backend/` with NestJS project layout (apps, modules, Prisma integration).
- Use **Prisma ORM** for the PostgreSQL data model, enabling typed access, migrations, and seeds.
- Introduce `pnpm` or `npm` workspaces to manage `frontend` and `backend` packages independently. Initial implementation will use npm with separate lockfiles.
- Shared types (e.g., DTOs, enums) will be published via a local `packages/contracts` workspace for frontend consumption.
- CI must install, lint, and test both workspaces.
- Development environments will run two processes: `frontend (Vite/Next)` and `backend (Nest + Prisma)`. A `docker-compose` definition will orchestrate Postgres, Redis, and the GSM bridge emulator during local dev.

## Open Items
- Confirm whether Supabase remains in scope as a managed Postgres or if the team prefers direct Cloud SQL/RDS. This ADR assumes managed Postgres with Prisma migrations under our control.
- Select queueing mechanism (initial proposal: BullMQ over Redis) and include it in the infra roadmap.
- Align monitoring stack (Prometheus/Grafana vs. hosted) before Phase 5 observability work.
