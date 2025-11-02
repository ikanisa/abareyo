# PWA Go-Live Checklist

- [ ] Update `.env` with production values for all keys validated in `config/validated-env.mjs`, including Supabase, onboarding, and JWT secrets.【4054fa†L36-L216】
- [ ] Verify `public/manifest.json` icons (192/512) exist and match branding; confirm `start_url` uses locale default.【4c26c3†L1-L47】
- [ ] Regenerate service worker with offline fallback per `report/patches/0004-service-worker.diff` and upload `offline.html` to CDN.【78443a†L1-L107】
- [ ] Run `npm run build` and ensure no Zod validation errors by supplying CI secrets.【583a95†L1-L86】
- [ ] Execute `npm run lint:pwa` (Lighthouse CI) and confirm all categories ≥ 90; attach report artifacts from `.lighthouseci`.
- [ ] Validate Workbox runtime caching covers tickets, community, and offline fallback using Chrome DevTools offline mode.【bda78f†L1-L116】
- [ ] Confirm `next.config.mjs` security headers emit CSP including `default-src 'self'` and upgrade-insecure-requests once patched.【63f378†L1-L34】
- [ ] Ensure `robots.txt` and sitemap reflect production URLs.
- [ ] Capture responsive screenshots (mobile, tablet, desktop) for QA sign-off.
- [ ] Publish SBOM artifact (`sbom-web.json`) to release bundle and archive with changelog.
