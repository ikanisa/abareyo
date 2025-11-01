# Launch Assets Overview

This directory centralises the cross-platform launch artefacts for the GIKUNDIRO PWA and companion native shells. Every file is production ready and aligned with the updated accessibility + performance profile captured in the release checklists.

## Contents

| Folder | Purpose |
| --- | --- |
| [`icons/`](./icons) | Final store icons sized from a 1024×1024 master vector. Colours use the club palette for parity across Apple and Google listings. |
| [`screenshots/`](./screenshots) | High-level storyboard mocks sized for both stores. Use them as templates when capturing device specific imagery. |
| [`checklists/`](./checklists) | Signed off audits (WCAG/VoiceOver/TalkBack), performance benchmarks, and submission checklists. |
| [`promo-copy.md`](./promo-copy.md) | Localised marketing copy blocks for store listings, announcements, and paid campaigns. |

## Usage

1. Export PNGs from the provided SVG sources at the resolutions required by Apple/Google.
2. When capturing device screenshots, keep the annotated regions from the mocks to highlight focus order, wallet states, and matchday alerts.
3. Ensure every release references the latest audit entries in [`checklists/`](./checklists).

## Last Updated

- **WCAG audit**: 2025-02-14
- **Performance profiling**: 2025-02-14
- **Store copy**: 2025-02-14

