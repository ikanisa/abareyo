# Release Notes – Supabase key refresh and auth endpoint cleanup

## Summary
- Added publishable Supabase key coverage to production templates, GitHub Actions secrets, and Kubernetes secrets to unblock new client SDK policies.
- Removed legacy admin token exposure and deprecated Supabase JWT placeholders from environment samples and cluster secrets.
- Documented the need for staging verification of login, invite, and QR ticket flows after deploying the refreshed configs.

## Verification
- Staging deploy and end-to-end checks (login → invite → QR redemption) still need to be run in the managed environment; not executed from this offline workspace.
