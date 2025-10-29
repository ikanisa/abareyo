# Performance Exercise Summary

## Overview
- **Objective**: Evaluate `/api/live` surfaces and core admin APIs under synthetic load to size Supabase and Next.js autoscaling triggers.
- **Approach**: Artillery scenario driving parallel traffic to the live scoreboard/match detail endpoints and three high-touch admin APIs. A lightweight mock service (`tests/perf/mock-server.mjs`) emulates typical response bodies with deterministic latency bands so the test can run in local CI without full Supabase/Next.js bootstrapping. 【F:tests/perf/mock-server.mjs†L1-L74】

## How to Reproduce
1. Start the mock service (binds to port `3100` by default):
   ```bash
   MOCK_PORT=3100 node tests/perf/mock-server.mjs
   ```
2. Run the Artillery scenario with proxy variables disabled (the hosted toolchain injects HTTP proxies that return 403s for localhost targets):
   ```bash
   HTTP_PROXY= HTTPS_PROXY= http_proxy= https_proxy= \
   ADMIN_SESSION_COOKIE="admin_session=mock" \
   npx artillery run tests/perf/live-and-admin.yml -o tests/perf/results-live-admin.json
   ```
   The scenario ramps from 5 → 30 virtual users/second over 80 seconds and asserts on p99 latency and minimum request rate. 【F:tests/perf/live-and-admin.yml†L1-L35】
3. Inspect `tests/perf/results-live-admin.json` for aggregate metrics, or re-run with `artillery report` for HTML visualization. 【F:tests/perf/results-live-admin.json†L1-L38】【F:tests/perf/results-live-admin.json†L40-L74】

## Key Findings (p95 latency unless noted)
| Endpoint | Requests | p50 | p95 | Max |
| --- | ---:| ---:| ---:| ---:|
| `/api/live/scoreboard` | 755 | 40.9 ms | 44.3 ms | 63 ms 【F:tests/perf/results-live-admin.json†L32-L38】【F:tests/perf/results-live-admin.json†L109-L120】|
| `/api/live/match/demo` | 304 | 61.0 ms | 62.2 ms | 80 ms 【F:tests/perf/results-live-admin.json†L32-L38】【F:tests/perf/results-live-admin.json†L122-L133】|
| `/admin/api/users/directory` | 150 | 120.3 ms | 122.7 ms | 124 ms 【F:tests/perf/results-live-admin.json†L32-L38】【F:tests/perf/results-live-admin.json†L135-L146】|
| `/admin/api/content/library` | 163 | 162.4 ms | 162.4 ms | 184 ms 【F:tests/perf/results-live-admin.json†L32-L38】【F:tests/perf/results-live-admin.json†L148-L159】|
| `/admin/api/shop/products` | 128 | 202.4 ms | 202.4 ms | 212 ms 【F:tests/perf/results-live-admin.json†L32-L38】【F:tests/perf/results-live-admin.json†L161-L172】|

Overall throughput settled at **~19 req/s** with zero failures, and global p95 latency stayed at ~202 ms while p50 remained at 55 ms. 【F:tests/perf/results-live-admin.json†L1-L38】【F:tests/perf/results-live-admin.json†L74-L86】

## Autoscaling Recommendations
### Next.js Edge/API tier
- Baseline pods comfortably handle 30 rps with p95 ≤ 200 ms. Configure autoscaling to add a replica when rolling 3-minute p95 exceeds **250 ms** or when concurrent requests surpass **35 rps**, giving margin for Supabase round-trips on admin flows. 【F:tests/perf/results-live-admin.json†L74-L86】【F:tests/perf/results-live-admin.json†L109-L172】
- For Kubernetes Horizontal Pod Autoscalers or similar scaling mechanisms, translate the above into CPU targets (~55–60% at 30 rps assuming 80 ms average service time) and enable a floor of **2** instances to absorb redeploy spikes.

### Supabase (Postgres + Edge Functions)
- Admin endpoints plateau at ~200 ms because of simulated Supabase access; to stay under 250 ms in production, ensure **min 2** database instances (or 1 primary + 1 read replica) during peak events and scale read IOPS when queue depth exceeds 20. 【F:tests/perf/results-live-admin.json†L135-L172】
- Enable Supabase autoscaling alerts when 95th percentile query duration >150 ms or CPU >65% for 5 consecutive minutes, aligning with the measured admin p95 bands.

## Follow-ups
- Replace the mock service with staging traffic replay once Supabase sandbox credentials are available; this will validate the 200 ms admin ceiling against real query plans.
- Extend the scenario with authenticated `POST` flows (ticket refunds, content publish) to capture write amplification costs before production events.
- Wire the Artillery run into CI nightly to track regressions and surface autoscaling breaches automatically.
