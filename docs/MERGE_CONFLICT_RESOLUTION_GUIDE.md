# Merge Conflict Resolution Guide

## Problem Overview

Four pull requests (#243, #246, #250, #256) targeting the `main` branch have cascading merge conflicts due to:

1. **Divergent Base SHAs**: Each PR was created against different points in history
2. **Shared Infrastructure Modifications**: All four PRs modify core monorepo files
3. **Sequential Dependencies**: Implied logical order not enforced by Git
4. **Large Overlapping Changesets**: ~128 files with substantial JSON, YAML, and TypeScript config changes

## Root Cause Analysis

### Divergent Base SHAs

| PR # | Base SHA | Status | Description |
|------|----------|--------|-------------|
| 256 | 60402e4 | Most recent | USSD utilities & pay buttons |
| 250 | 29d837a | 1 commit behind | Admin control plane |
| 246 | e7a665d | 2 commits behind | Shared linting toolchain |
| 243 | e7a665d | 2 commits behind | Performance tooling |

**Impact**: When PR #256 advances `main`, it invalidates the base of the three older PRs.

### Shared Infrastructure Files

All four PRs modify these critical files:

- **package.json**: Different dependencies, scripts, workspace references
- **.github/workflows/**: CI/CD pipeline modifications
- **tsconfig.json**: Path aliases and compiler options
- **eslint.config.js**: Linting rules and shared config references
- **next.config.mjs**: Build configuration
- **vitest.config.ts**: Test configuration

### Dependency Chain

```
PR #246 (shared config)     → Foundation layer
    ↓
PR #243 (performance)        → Uses shared config
    ↓
PR #250 (admin workspace)    → Depends on config + performance
    ↓
PR #256 (USSD utilities)     → Expects workspace structure
```

## Recommended Resolution Strategy

### Phase 1: Fix Pre-existing Issues ✅

**Completed in this PR:**

1. ✅ Fix lint errors (admin layout react-refresh rules)
2. ✅ Fix vitest config (exclude e2e/backend tests)
3. ✅ Remove duplicate pages (members/settings conflicts)
4. ✅ Fix package exports and naming consistency
5. ✅ Add TypeScript path aliases for @rayon/* packages
6. ✅ Fix React Native module resolution for web builds
7. ✅ Fix type-only imports for verbatimModuleSyntax

### Phase 2: Sequential Merge Order

**Recommended merge sequence:**

1. **Merge PR #246 first** (shared config foundation)
   - Establishes `packages/config/` structure
   - Sets up shared ESLint and TypeScript configs
   - Minimal conflicts expected

2. **Rebase PR #243 onto updated main** (performance tooling)
   - Resolve conflicts in `.github/workflows/`
   - Coordinate `package.json` scripts for performance tools
   - Validate Lighthouse CI integration

3. **Rebase PR #250 onto latest main** (admin workspace)
   - Resolve `app/admin/` structure conflicts
   - Merge workflow additions
   - Reconcile TypeScript path aliases

4. **Rebase PR #256 onto final main** (USSD utilities)
   - Resolve `packages/api/` additions
   - Merge payment component changes
   - Final validation of complete workspace

### Phase 3: Conflict Resolution by File

#### package.json Conflicts

**Common conflicts:**
- Dependencies (vite, Lighthouse CLI, admin UI libs)
- Scripts (lint, typecheck, ci:*)
- Workspace references

**Resolution strategy:**
1. Merge all unique dependencies
2. Combine scripts, avoiding duplicates
3. Ensure workspace array includes all packages
4. Validate with `npm install` and `npm run typecheck`

**Example merge:**
```json
{
  "scripts": {
    "lint": "eslint app src tests/unit",
    "lint:pwa": "npm run build && lhci autorun",
    "lint:admin": "eslint app/admin --max-warnings=0",
    "typecheck": "tsc -b tsconfig.build.json"
  },
  "workspaces": [
    "packages/*",
    "apps/*",
    "docs"
  ]
}
```

#### tsconfig.json Conflicts

**Common conflicts:**
- Path aliases (@/admin/*, @rayon/*)
- Compiler options
- References to workspace packages

**Resolution strategy:**
1. Merge all path aliases
2. Keep strictest compiler options
3. Validate with `npm run typecheck`

**Example merge:**
```json
{
  "paths": {
    "@/app/*": ["./app/*"],
    "@/config/*": ["./src/config/*", "./config/*"],
    "@rayon/api/*": ["./packages/api/src/*"],
    "@rayon/config/*": ["./packages/config/*"],
    "@rayon/contracts": ["./packages/contracts/src/index.ts"]
  }
}
```

#### eslint.config.js Conflicts

**Common conflicts:**
- Shared config package reference
- New rules or exceptions
- File pattern matching

**Resolution strategy:**
1. Use shared config from PR #246 as base
2. Merge additional rules from other PRs
3. Ensure consistency with workspace structure
4. Validate with `npm run lint`

#### .github/workflows/ Conflicts

**Common conflicts:**
- Job ordering
- New workflow files
- Environment variables

**Resolution strategy:**
1. Merge workflow files (lighthouse-ci.yml, admin.yml)
2. Combine job steps where logical
3. Validate environment variable coverage
4. Test locally with `act` if possible

### Phase 4: Validation Checklist

After each merge:

- [ ] `npm ci` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (with known pre-existing failures documented)
- [ ] CI pipeline completes successfully

## Common Pitfalls to Avoid

1. **Don't merge all PRs simultaneously** - Sequential merging prevents cascading conflicts
2. **Don't skip validation between merges** - Each merge must be stable before the next
3. **Don't ignore pre-existing failures** - Document them, but don't introduce new ones
4. **Don't force-push to main** - Use proper PR review process for each merge
5. **Don't mix scope** - Keep each PR's changes focused during conflict resolution

## Package Naming Consistency

**Established naming convention:**
- Use `@rayon/*` for shared packages (api, config, contracts, design-tokens, mobile, ui)
- Use `@abareyo/*` ONLY if intentionally separating namespace

**Current packages:**
- `@rayon/api` ✅
- `@rayon/config` ✅
- `@rayon/contracts` ✅
- `@rayon/design-tokens` ✅
- `@rayon/mobile` ✅
- `@rayon/ui` ✅

## Workspace Structure

```
├── packages/
│   ├── api/           # HTTP & Supabase clients
│   ├── config/        # Shared configuration
│   ├── contracts/     # Shared TypeScript types
│   ├── design-tokens/ # Design system tokens
│   ├── mobile/        # React Native components
│   └── ui/            # Shared UI components
├── apps/
│   ├── admin/         # (placeholder)
│   ├── mobile/        # (placeholder)
│   └── web/           # (placeholder)
├── docs/              # Documentation workspace
└── app/               # Next.js App Router (main web app)
```

## Testing Merge Conflict Resolution

1. **Create test branch:** `git checkout -b test-merge-resolution`
2. **Merge in order:** Follow the sequential strategy above
3. **Run full validation:** Complete the validation checklist
4. **If successful:** Apply to production branches
5. **If issues found:** Document and adjust strategy

## Post-Merge Actions

1. **Update documentation:** Reflect new workspace structure
2. **Notify team:** Communicate changes and new patterns
3. **Update CI/CD:** Ensure pipelines reflect new structure
4. **Archive old PRs:** Close any outdated PRs with explanation

## Known Pre-existing Issues

Document but do NOT block merges on these (acknowledged in PRs #243 & #250):

- Partners page: null handling for partner category
- Various components: Array access with noUncheckedIndexedAccess
- Server-side files: Missing exports (rate-limiter, origins, etc.)
- Test files: Missing imports for app/ and lib/ files

These should be tracked in separate issues for future resolution.

## Contact & Support

For questions about this merge strategy, contact the repository maintainers or refer to:
- [AGENTS.md](../AGENTS.md) - Agent configuration
- [README.md](../README.md) - Repository overview
- [PR #246](https://github.com/ikanisa/abareyo/pull/246) - Shared config
- [PR #243](https://github.com/ikanisa/abareyo/pull/243) - Performance tooling
- [PR #250](https://github.com/ikanisa/abareyo/pull/250) - Admin workspace
- [PR #256](https://github.com/ikanisa/abareyo/pull/256) - USSD utilities
