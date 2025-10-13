# Marketplace Revamp Status

## Current Coverage
- **Navigation & discovery.** Shop landing uses the gradient shell with hero, filters, sort controls, and a simple onboarding card to guide first-time fans. 【F:app/(routes)/shop/ShopClientPage.tsx†L1-L56】【F:app/(routes)/shop/_components/ShopOnboarding.tsx†L1-L18】
- **Product catalogue.** The mock dataset follows the unified product contract with price, stock, and badge metadata for jerseys, training gear, accessories, bundles, and kids lines. 【F:app/(routes)/shop/_data/products.ts†L1-L121】
- **Filters & sorting.** Client-side filters cover category, size, colour, stock, and price ranges with modal sheets wired to the shared hook contract. Sort options expose recommended, price, newest, and popular ordering. 【F:app/(routes)/shop/_components/FilterSheet.tsx†L1-L89】【F:app/(routes)/shop/_components/SortSheet.tsx†L1-L54】【F:app/(routes)/shop/_logic/useShop.ts†L1-L109】
- **PDP essentials.** The product detail view renders image gallery, variant selectors, add-to-cart, and USSD checkout button alongside badge chips and size guide modal. 【F:app/(routes)/shop/[slug]/PdpClientPage.tsx†L1-L111】【F:app/(routes)/shop/_components/PDPGallery.tsx†L1-L18】【F:app/(routes)/shop/_components/UssdPayButton.tsx†L1-L44】
- **Cart + USSD checkout.** Cart view lists line items, totals, clear/remove actions, and exposes USSD payment CTA with clipboard fallback for iOS. 【F:app/cart/CartClientPage.tsx†L1-L63】【F:app/(routes)/shop/_components/UssdPayButton.tsx†L1-L44】

## Outstanding Gaps vs Spec
1. **Advanced merchandising**
   - Rails currently surface a single "Recommended" track; additional curated rows (new arrivals, bundles) can be reintroduced once merchandising data solidifies. 【F:app/(routes)/shop/ShopClientPage.tsx†L28-L55】
2. **Cart depth**
   - Quantity adjustments and variant swaps are not yet implemented in the simplified cart experience. Consider extending `useCart` with update helpers for parity with earlier flows. 【F:app/(routes)/shop/_logic/useShop.ts†L96-L132】
3. **Localisation**
   - Copy uses a minimal English-only string map; integrating translations or CMS-driven text would restore bilingual coverage highlighted in previous iterations. 【F:app/(routes)/shop/_hooks/useShopLocale.tsx†L1-L28】

## Recommended Phased Plan
- **Phase 1 – Cart polish (1 day)**
  - Add quantity steppers and variant swap controls that write through the shared cart store.
- **Phase 2 – Merchandising expansion (1–2 days)**
  - Reintroduce dedicated rails for new arrivals, deals, and bundles plus lightweight skeleton states.
- **Phase 3 – Copy & localisation (1 day)**
  - Expand locale map or integrate translation source to cover PDP notes, onboarding text, and cart summaries.

## Open Questions
- Should USSD support expose explicit MTN/Airtel toggles or keep a single default CTA?
- Are additional payment or delivery instructions required on the PDP before launch?
