# Release Screenshot Archive

Use this directory to store canonical device screenshots captured for every release:

- **Install flows** – Document iOS Safari share-sheet instructions and Android/Chrome install prompts that guide users to add the app to their home screen.
- **USSD payment instructions** – Capture the copy-to-clipboard fallback UI, dialer CTAs, and payment instructions that appear before launching a USSD session.

## Capture & Naming Guidance

1. Use real devices (or high-fidelity emulators) that match the release target (e.g., iPhone 13 Safari, Pixel 8 Chrome).
2. Save PNG files named `<release>-<device>-<context>.png`, for example `2025-11-ios-install.png` or `2025-11-pixel-ussd.png`.
3. Place annotated versions (with callouts for share buttons or payment copy) alongside the raw captures when available.
4. Reference the uploaded assets in the release ticket and in [`DEPLOYMENT_CHECKLIST.md`](../../DEPLOYMENT_CHECKLIST.md).

> Tip: Pair these screenshots with the Lighthouse and Playwright artifacts produced in CI to maintain an auditable release bundle.
