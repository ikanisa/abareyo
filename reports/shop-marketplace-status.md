# Marketplace Revamp Status

## Current Coverage
- **Navigation & discovery.** The shop header ships search, cart/profile shortcuts, and tabbed categories that match the IA brief, with active-filter summaries and motion-aware tab indicator. 【F:app/(routes)/shop/_components/ShopHeader.tsx†L23-L88】
- **Merchandising rails.** Home view renders hero, top picks, new arrivals, deals, fan favourites, and a full grid backed by mock catalog/filter logic. 【F:app/(routes)/shop/ShopClientPage.tsx†L16-L86】【F:app/(routes)/shop/_logic/useShop.ts†L197-L263】
- **Filtering, sorting, and URL state.** Bottom-sheet filters expose category, price, size, colour, tags, and availability while syncing to query params alongside sort/search debounce. 【F:app/(routes)/shop/_components/FilterSheet.tsx†L24-L189】【F:app/(routes)/shop/_logic/useShop.ts†L43-L192】
- **Product merchandising.** Cards highlight authenticity badges, sale strikethroughs, size peek, and quick add-to-cart with shared cart store. 【F:app/(routes)/shop/_components/ProductCard.tsx†L20-L159】【F:app/(routes)/shop/_logic/useShop.ts†L264-L360】
- **PDP essentials.** Variant selector, size guide modal hook-up, trust microcopy, and USSD CTA land per spec, plus cross-sell and recently viewed rails. 【F:app/(routes)/shop/[slug]/PdpClientPage.tsx†L16-L98】【F:app/(routes)/shop/_components/VariantSelector.tsx†L16-L78】
- **Cart + USSD checkout.** Cart supports qty adjustments, optional pickup number, persistent totals, bilingual promos, and USSD deep link with waiting-state capture. 【F:app/cart/CartClientPage.tsx†L1-L367】【F:app/(routes)/shop/_components/UssdPayButton.tsx†L12-L160】
- **Localisation & onboarding.** A locale toggle and dual-language copy span header, hero, cards, PDP, cart, and USSD flows, backed by a dismissible onboarding sheet for first-time shoppers. 【F:app/(routes)/shop/_hooks/useShopLocale.tsx†L1-L210】【F:app/(routes)/shop/_components/ShopOnboarding.tsx†L1-L108】【F:app/(routes)/shop/_components/ShopHeader.tsx†L18-L97】

## Outstanding Gaps vs Spec
1. **Checkout integrations**
   - Front-end telemetry now captures locale switches, onboarding dismissals, and USSD payment references via the new `/api/marketplace/events` endpoint, but back-office tooling still needs to consume these events alongside SMS confirmations to fully automate order reconciliation. 【F:app/api/marketplace/events/route.ts†L1-L47】【F:app/(routes)/shop/_components/UssdPayButton.tsx†L18-L142】【F:app/(routes)/shop/_components/ShopOnboarding.tsx†L8-L116】
2. **Asset pipeline**
   - Product imagery and copy live in JSON catalogues for non-dev edits, yet they still require a manual deployment to publish; wiring a CMS or storage bucket hook-in would unlock content ops autonomy. 【F:app/(routes)/shop/_data/catalogue.json†L1-L410】【F:app/(routes)/shop/_data/copy.json†L1-L526】【F:app/(routes)/shop/_data/products.ts†L1-L44】【F:app/(routes)/shop/_hooks/useShopLocale.tsx†L1-L118】

## Recommended Phased Plan
- **Phase 1 – Media & merchandising polish (est. 2–3 days)**
  - Replace gallery and card placeholders with `next/image` components, add low-quality placeholders, and enable swipe + pinch zoom via Framer Motion/gesture handlers. 【F:app/(routes)/shop/_components/PDPGallery.tsx†L8-L50】
  - Implement alternate image reveal on hover/long-press using motion variants and actual secondary assets. 【F:app/(routes)/shop/_components/ProductCard.tsx†L52-L79】
  - Compute and display sale percentages in deals rail/cards and surface shimmer loaders for hero imagery.

- **Phase 2 – Checkout enhancements (est. 2 days)**
  - Allow variant/size swaps inside cart items (dropdown or modal) and introduce promo code input with validation hooks. ✅
  - Add payment method tiles for MTN MoMo/Airtel Money with stateful selection feeding the USSD payload, plus explicit waiting overlay and manual reference entry form tied to cart order context. ✅

- **Phase 3 – Performance & accessibility hardening (est. 1–2 days)**
  - Code-split heavy sheets/modals, audit focus management, and ensure every interactive region meets 44px sizing on all breakpoints. ✅
  - Add responsive image sizes, lazy loading, and prefers-reduced-motion fallbacks across rails; extend skeleton loaders to PDP and hero assets. ✅

- **Phase 4 – Localisation & onboarding (complete)**
  - Ship bilingual microcopy, locale toggle, and first-run onboarding sheet to satisfy RW/EN requirements while persisting user preference. ✅

## Open Questions
- Confirm desired asset pipeline (CMS, local placeholders, or CDN) to wire real imagery and alt text.
- Clarify SMS confirmation integration requirements for manual reference capture (API endpoint vs local storage placeholder).
