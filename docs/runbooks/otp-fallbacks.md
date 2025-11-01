# OTP Fallback & Manual Recovery Runbook

_Last updated: 2025-10-29_

This runbook captures the operational steps for recovering the WhatsApp OTP pipeline when Redis,
rate limiting, or template approvals fail. It complements `docs/runbooks/incident-response.md` and
`docs/runbooks/deploy.md`.

---

## 1. Situation Assessment

1. Confirm the nature of the incident:
   - **Redis degraded** – OTP dashboard (`/admin/sms/otp`) shows `memory fallback` or `Redis unavailable`.
   - **Template rejection** – Meta rejects the WhatsApp template or approval expires.
   - **Spike in abuse** – Rate limit counters saturating, repeated OTP requests from same IP/number.
2. Capture the current metrics:
   - `curl -H "x-admin-token: $ADMIN_TOKEN" $BACKEND_URL/admin/otp/dashboard`
   - `kubectl logs deployment/backend -n rayon | grep "otp" | tail -n 50`
3. Notify the on-call lead in #ops with a short summary and link to the incident ticket.

---

## 2. Manual Session Provisioning

Use this when Redis is down or OTP delivery is unavailable but fans still need access.

```bash
# 1. Generate a temporary session ID
SESSION_ID=$(uuidgen)

# 2. Issue the session cookie via the backend (fastify route)
curl -X POST "$BACKEND_URL/auth/fan/from-onboarding" \
  -H "content-type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}" \
  -c fan-session-cookie.txt

# 3. Manually set the cookie for a user (browser DevTools > Application > Cookies)
#    or hand the file to the supporter services agent.
```

Document any manual sessions in the incident ticket and revoke them once OTP delivery is restored.

---

## 3. Redis Flush & Health Validation

Only run these commands if Redis contains corrupted OTP entries or stale cooldowns. Capture a `redis-cli INFO replication` snapshot before and after to confirm the primary remains healthy.

```bash
# Flush OTP keys while leaving other modules untouched
redis-cli -u "$REDIS_URL" --scan --pattern "otp:*" | xargs -r redis-cli -u "$REDIS_URL" del

# Validate Redis responds to PING
redis-cli -u "$REDIS_URL" PING

# Double-check rate-limit window state after the flush
curl "$BACKEND_URL/otp/status" | jq '{redis, rateLimits}'
```

After the flush, redeploy the backend pods to repopulate in-memory caches:

```bash
kubectl rollout restart deployment/backend -n rayon
kubectl rollout status deployment/backend -n rayon
```

---

## 4. WhatsApp Template Compliance

1. Review Meta Business Manager for the template status.
2. Update the approval metadata in the environment configuration:
   - `OTP_WHATSAPP_TEMPLATE_APPROVED=1`
   - `OTP_WHATSAPP_RATE_LIMIT_DOC=https://...` (link to Meta policy or internal doc)
3. Coordinate with localization to ensure the consent copy matches the approved template. See
   `app/_components/onboarding/OnboardingModal.tsx` and `packages/mobile/app/(onboarding)/OnboardingStack.tsx`.
4. Run the smoke curl below to confirm the `status` endpoint reflects the approval flag:

```bash
curl "$BACKEND_URL/otp/status"
```

---

## 5. Abuse Controls & Emergency Blacklists

1. Access `/admin/sms/otp` and review the **Rate limited** counter.
2. Add abusive numbers or IPs via:

```bash
curl -X POST "$BACKEND_URL/admin/otp/blacklist" \
  -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"type":"phone","value":"+250788000000","note":"Incident #123"}'
```

3. Remove entries once the incident is mitigated:

```bash
curl -X DELETE "$BACKEND_URL/admin/otp/blacklist" \
  -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"type":"phone","value":"+250788000000"}'
```

Record every blacklist change in the incident timeline.

---

## 6. Post-Incident Checklist

- [ ] OTP dashboard counters return to normal levels.
- [ ] Redis status is `redis connected`.
- [ ] Consent copy verified in web and mobile onboarding flows.
- [ ] Incident retrospective updated with root cause and action items.
- [ ] Run `npm run smoke:telemetry` and the OTP curl smoke commands (see deployment checklist) to close the ticket.
