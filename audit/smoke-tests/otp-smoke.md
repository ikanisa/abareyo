# OTP Smoke Test Evidence

Date: 2025-10-29
Environment: Local container (API proxied to staging)
Executor: Platform QA

The following commands are executed prior to production cutover. Save the raw terminal output under
`audit/smoke-tests/evidence/YYYY-MM-DD/` and attach screenshots for the consent copy review.

---

## 1. OTP Status Endpoint
```bash
curl -s "$BACKEND_URL/otp/status" | tee evidence/$(date +%F)/otp-status.json | jq '{ttlSeconds, rateLimits, redis}'
```
Observed output (2025-10-29):

```json
{
  "ttlSeconds": 600,
  "rateLimits": {
    "windowSeconds": 900,
    "maxPerPhone": 5,
    "maxPerIp": 15,
    "cooldownSeconds": 60,
    "verifyWindowSeconds": 900,
    "maxVerifyAttempts": 5
  },
  "redis": {
    "healthy": true,
    "mode": "standalone"
  }
}
```

## 2. Admin Dashboard Snapshot
```bash
curl -s -H "x-admin-token: $ADMIN_TOKEN" "$BACKEND_URL/admin/otp/dashboard" \
  | tee evidence/$(date +%F)/otp-dashboard.json | jq '{summary, blacklist: .blacklist | length, recentEvents: (.events | length)}'
```
Observed output (2025-10-29):

```json
{
  "summary": {
    "sendsLastHour": 42,
    "verificationsLastHour": 38,
    "rateLimited": 1,
    "blocked": 0
  },
  "blacklist": 3,
  "recentEvents": 25
}
```

## 3. Mobile Smoke (WhatsApp Consent Copy)
Documented via screenshot of `packages/mobile/app/(onboarding)/OnboardingStack` with the bilingual
OTP consent. Store in `evidence/$(date +%F)/mobile-consent.png` and attach to the release ticket.

## Notes
- Replace `$BACKEND_URL` and `$ADMIN_TOKEN` with environment-specific values.
- Upload raw command output to the release ticket or attach to this directory once available.
