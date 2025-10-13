# Marketplace Revamp Status

## Current Coverage
- **Unified shop contract.** `useCatalog` now exposes `list`, `all`, `filters`, and `setFilters`, while the new `useShop` aggregator returns the canonical `{ list, all, filters, setFilters, sort, setSort, addToCart, cart, total }` shape shared by Shop, PDP, and Cart surfaces.
- **Locale helpers.** `useShopLocale` keeps the existing translation helper and additionally returns a simple bilingual string map so App Router components can consume either form without recomputing copy.
- **USSD checkout.** `UssdPayButton` accepts `{ amount, phone, provider }` and preserves the waiting overlay plus reference capture flows required by PDP and Cart.
- **Matches surface.** `/matches` now reads `/api/matches`, which provides `{ matches }`, and renders live, upcoming, and full-time fixtures through the shared PageShell layout.

## Outstanding Gaps vs Spec
1. **Catalog content** – Product imagery and descriptions still ship from local fixtures; the merchandising pipeline needs real assets before launch.
2. **Operational follow-up** – Locale-aware messaging for downstream order receipts remains a backlog item once the checkout APIs integrate.

## Recommended Next Steps
- Add regression tests covering the `useShop` aggregator to protect the contract during future filter or cart changes.
- Replace gallery placeholders with optimised assets once the media pipeline lands.
