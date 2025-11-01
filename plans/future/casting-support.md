# Casting Support Rollout Plan

## Vision
Enable Chromecast and AirPlay support inside the supporter app so fans can project live matches and highlights to shared screens without leaving the mobile experience.

## Remote Controls
- **Feature flag:** `features.streamingCast`
- **Remote config:** `widgets.casting.allowedDevices` (comma-delimited allow list for QA vs production hardware)

## Dependencies
- CDN must expose multi-bitrate HLS manifests to avoid playback stalls on large displays.
- Native shells require Capacitor `@capacitor/app` and `@capacitor/status-bar` upgrades to handle background playback.
- Observability stack (Sentry + Loki) must capture casting session diagnostics to measure failure rates.

## Rollout Strategy
1. **Internal QA:** enable flag for staging project, constrain devices to the engineering lab allow list.
2. **Hospitality partners:** expand allow list with venue screens, monitor Supabase session metrics for load.
3. **General availability:** default flag to `true` after verifying CDN scaling and customer support readiness.

## Stakeholder Notes
- Coordinate with Marketing for launch messaging.
- Provide Support with troubleshooting runbook including network health checks.
