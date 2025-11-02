# Expo Router Native Shell

The React Native workspace under `packages/mobile/` now runs on Expo Router with a tab-first layout that mirrors the web IA.

## Navigation shape
- Tabs live under `app/(tabs)/` with nested stacks for each feature area (Home, Matches, Tickets, Shop, More).
- Detail views (e.g., `matches/[id].tsx`, `home/news/[slug].tsx`) sit inside the relevant stack to preserve gestures and shared headers.
- Deep links are mapped in `src/linking.ts` and referenced from `app.config.ts` so that `gikundiro://` and universal links resolve to the right screen. Call `toWebUrl()` when you need to fall back to the web client.

## Metro & runtime tweaks
- `metro.config.js` keeps Yarn/NPM workspaces in sync by watching the monorepo root; no extra resolver wiring is required when adding shared packages.
- Hermes is the default JS engine and release builds enable Proguard/resource shrinking through the `expo-build-properties` plugin (see `app.config.ts`).
- Production builds strip console output via `babel-plugin-transform-remove-console`; only `console.warn`/`console.error` survive to ease crash triage.

## Assets & branding
- App icons and splash art are generated on demand into `packages/mobile/assets/` the first time `app.config.ts` runs. The generator (`tools/brand-assets.ts`) draws the gradient crest and avoids storing binary blobs in Git; set `GIKUNDIRO_FORCE_BRAND_ASSET_REBUILD=1` to refresh them.
- `app.config.ts` applies the icons, splash, bundle identifiers (`com.gikundiro.app`), and associated domains (`applinks:gikundiro.com`).

## Tooling & EAS
- `eas.json` remains the source of truth for channels; Hermes/Proguard settings ride through OTA updates because they’re baked into the native binaries.
- Detox scaffolding sits in `e2e/` with a `detox.config.ts` preset. Run `npm run test:e2e --prefix packages/mobile` after building the native binary via Expo when you need device coverage.
