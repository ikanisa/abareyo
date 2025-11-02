# Dependencies Report
Generated: 2025-11-02T12:17:28.294Z

## Summary
- Package Manager: npm@11.4.2
- Node Version: >=20.0.0 <21
- Total Dependencies: 110
  - Production: 71
  - Development: 39

## Key Dependencies
- React: ^18.3.1
- Next.js: ^14.2.33
- TypeScript: ^5.8.3
- Supabase JS: ^2.74.0
- TanStack Query: ^5.83.0
- Zod: ^3.25.76

## Workspaces
- packages/*
- apps/*
- docs

## USSD-Only Compliance Check
Checking for prohibited payment SDKs...

### ✅ No Card/Wallet SDKs Found
The following are NOT present (good):
- stripe
- paypal
- square
- braintree
- checkout.com
- adyen
- flutterwave (except USSD)

### ✅ USSD Infrastructure Present
- Custom USSD utilities in lib/ussd.ts
- USSD payment scripts in scripts/

## Recommendations
- [ ] Consider moving to pnpm fully (already configured)
- [ ] Update deprecated packages (eslint@8 → eslint@9)
- [ ] Review security vulnerabilities (npm audit)
- [ ] Ensure all packages support Node 20
