# Contracts changelog

## 2024-12-01

- Introduced versioned contract modules for tickets, retail, insurance, and SACCO domains under `packages/contracts/src/*`.
- Added embedded changelog metadata and deprecation windows (minimum 120-180 day support depending on domain).
- Published zod schemas for checkout, wallet, and service flows to generate shared API types via `@rayon/api/contracts/*`.
