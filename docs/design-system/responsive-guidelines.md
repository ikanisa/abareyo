# Responsive Layout & Breakpoint Guidelines

_Last updated: 2025-03-05_

## Audit summary

We reviewed the following admin surfaces at 1280 px, 1440 px, and 1920 px viewports to catalogue overflow
and density pain points before refactoring:

| Surface | Previous issue | Observed at |
| --- | --- | --- |
| `/admin/membership` plan table | Table wrapper clipped columns and forced horizontal scrolling past the viewport because it lacked a scroll container and minimum width guard rails. | 1280 px & 1440 px |
| `/admin/membership` member table | Filters and pagination controls collapsed into a single line, truncating the status selector and pagination buttons. | 1280 px |
| `/admin/reports` scheduler | Four-up form grid stretched across ultrawide widths, creating unreadable line lengths, while smaller viewports suffered from overlapping inputs. | 1440 px & 1920 px |
| `/admin/realtime` analytics | Event filter buttons wrapped unpredictably and the feed stretched edge-to-edge, making payloads hard to scan. | 1440 px & 1920 px |

## Breakpoint contract

We rely on Tailwind’s default breakpoints with the following container clamps for admin modules. When in doubt,
apply the closest clamp below to keep layouts consistent across the 1280 → 1920 px spectrum.

| Token | px | Usage |
| --- | --- | --- |
| `sm` | 640 | Stack filters/forms vertically and expand inputs to 100%. |
| `md` | 768 | Introduce multi-column grids via `md:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]` for forms. |
| `lg` | 1024 | Promote shell sidebars (`md:w-[clamp(15rem,20vw,18.5rem)]`) and use `lg:px-10` container padding. |
| `xl` | 1280 | Clamp primary content to `max-w-[min(90rem,calc(100vw-3rem))]` inside admin shells. |
| `2xl` | 1536 | Expand to `max-w-[min(100rem,calc(100vw-6rem))]` and increase horizontal padding to `2xl:px-12`. |

## Responsive utilities

- **Fluid width inputs:** Prefer `w-[clamp(16rem,22vw,20rem)]` for search/filter controls so they scale on ultrawide monitors
  but remain usable at 1280 px.
- **Scrollable data regions:** Wrap tables with `overflow-x-auto` and apply `min-w-[680px]` (or component-specific width)
  to guard against column compression. Pair with `break-words` on `TableCell` to prevent overflow.
- **Collapsible panels:** Use Radix `Collapsible` with trigger icons for dense forms and analytics filters. Default-open critical
  panels (e.g., schedule creation) and collapse secondary tooling (event filters) on load for smaller screens.
- **Pagination/footer flex:** Wrap pagination rows in `flex flex-col sm:flex-row` to avoid clipping when localized copy grows.

## Implementation checklist

1. Clamp every admin page within the `AdminShell` container so content never exceeds the 1440 px design canvas on desktops.
2. Add horizontal scroll guards to legacy tables (`overflow-x-auto`, `min-w-*`) before introducing new columns.
3. Gate bulky filter and action sections behind collapsible panels when they exceed two rows of controls.
4. Snapshot responsive behaviour in Playwright at 1280 px, 1440 px, and 1920 px before accepting new modules.
5. Document any bespoke clamp values in this file to keep the contract visible to engineers and designers.
