# CI Pipeline Fixes - Usage Guide

This directory contains scripts and configurations to help maintain a clean, host-agnostic, and secure CI pipeline.

## Files Added

### 1. `.gitleaks.toml`
Configuration file for GitLeaks secret scanning tool. It defines allowlists for:
- Example configuration files (`.env.example`, `.env.template`, etc.)
- Test files (`*.test.ts`, `*.spec.ts`)
- Common test/example values (`ci-*-key`, `test-*-token`, placeholder patterns)

**Usage:**
```bash
# Install gitleaks (if not already installed)
# Visit: https://github.com/gitleaks/gitleaks#installing

# Run gitleaks scan
gitleaks detect --config .gitleaks.toml --verbose
```

### 2. `fix-host-agnostic.sh`
Executable script that scans the codebase for platform-specific references (Vercel, Render, Heroku).

**Usage:**
```bash
# Make executable (if needed)
chmod +x fix-host-agnostic.sh

# Run the scan
./fix-host-agnostic.sh
```

**Exit Codes:**
- `0` - No platform-specific references found
- `1` - Found platform-specific references (review needed)

**Note:** The repository also has a more refined TypeScript guard: `npx tsx scripts/host_agnostic_guard.ts`

### 3. `fix-dependencies.sh`
Executable script that performs a complete dependency refresh and security audit.

**Usage:**
```bash
# Make executable (if needed)
chmod +x fix-dependencies.sh

# Run the fix
./fix-dependencies.sh
```

**What it does:**
1. Removes `node_modules` and `package-lock.json`
2. Installs fresh dependencies with `npm install`
3. Runs `npm audit` for security vulnerabilities
4. Checks for outdated packages with `npm outdated`

**⚠️ Warning:** This script will delete your `node_modules` directory. Make sure you don't have uncommitted changes.

### 4. `.husky/pre-commit`
Pre-commit hook that runs before each git commit to ensure code quality.

**What it runs:**
- ESLint linting on `app`, `src`, and `tests/unit`

**Usage:**
Pre-commit hooks run automatically when you commit. To skip (use sparingly):
```bash
git commit --no-verify -m "your message"
```

**Setup:**
```bash
# Install husky (already in devDependencies)
npm install

# The prepare script will automatically set up hooks
# Or manually run:
npx husky install
```

## Complete Fix Workflow

Follow these steps to implement all fixes:

### Step 1: Make scripts executable
```bash
chmod +x fix-host-agnostic.sh fix-dependencies.sh
```

### Step 2: Check for host-agnostic issues
```bash
./fix-host-agnostic.sh
# Or use the more refined TypeScript guard:
npx tsx scripts/host_agnostic_guard.ts
```

### Step 3: Set up environment variables
```bash
# Copy example to local environment
cp .env.example .env.local

# Edit .env.local and fill in your actual values
# CRITICAL: Ensure NEXT_PUBLIC_SITE_URL is set (build fails without it)
```

### Step 4: Install dependencies (if needed)
```bash
# Normal install
npm ci

# Or use the fix script for a complete refresh
./fix-dependencies.sh
```

### Step 5: Run all checks locally
```bash
# Linting
npm run lint

# Type checking (note: existing errors in codebase)
npm run type-check

# Unit tests
npm run test:unit

# Build
npm run build
```

### Step 6: Commit changes
```bash
# Stage your changes
git add .

# Commit (pre-commit hook will run automatically)
git commit -m "your commit message"

# Push
git push
```

## Environment Variables

### Required Variables for Build
These environment variables must be set in `.env.local` for the build to succeed:

```bash
# Critical - Build fails without this
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Required for backend communication
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side Supabase (required for build)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SITE_SUPABASE_URL=https://your-project.supabase.co
SITE_SUPABASE_SECRET_KEY=your-service-role-key

# Required for onboarding features
ONBOARDING_API_TOKEN=your-onboarding-token

# Optional but recommended for AI features
OPENAI_API_KEY=your-openai-key
```

### For CI/CD
Add these variables to your CI/CD platform:

**GitHub Actions (Settings → Secrets and variables → Actions):**
- Add all `NEXT_PUBLIC_*` variables
- Add server-side secrets (`SUPABASE_SERVICE_ROLE_KEY`, etc.)

**Netlify (Site settings → Environment variables):**
- Add all required environment variables
- Use the same names as in `.env.example`

## CI Workflows

The repository has comprehensive CI workflows in `.github/workflows/`:

### Main CI (`ci.yml`)
Runs on every push and pull request:
- Dependency installation with `npm ci`
- License compliance check
- ESLint linting
- TypeScript type checking
- Unit tests
- Backend environment validation
- Playwright E2E tests (with mocked API)
- Accessibility tests
- SBOM generation
- Build artifact attestation

### Host-Agnostic Guard (`host-agnostic-guard.yml`)
Ensures no platform-specific code (Vercel/Render):
- Runs `npx tsx scripts/host_agnostic_guard.ts`

### Security Scans (`security-scans.yml`)
Checks for security issues:
- Secret scanning
- Dependency vulnerabilities

## Netlify Configuration

The `netlify.toml` is already properly configured:

```toml
[build]
  command = "npm run build:netlify"
  publish = ".next"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "11.4.2"
```

Ensure all environment variables are set in Netlify dashboard before deployment.

## Troubleshooting

### Build fails with "Missing required environment variables"
**Solution:** Add `NEXT_PUBLIC_SITE_URL` to `.env.local`:
```bash
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local
```

### Pre-commit hook fails
**Solution:** Fix the linting errors or skip with `--no-verify` (not recommended):
```bash
npm run lint
# Fix any errors, then commit again
```

### npm ci fails
**Solution:** Try the dependency fix script:
```bash
./fix-dependencies.sh
```

### Host-agnostic guard fails
**Solution:** Review the reported files and replace platform-specific code with generic alternatives.

## Additional Resources

- [Repository README](README.md) - Main repository documentation
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [Netlify Deployment Checklist](NETLIFY_DEPLOYMENT_CHECKLIST.md) - Netlify-specific guide
- [Production Readiness](PRODUCTION_READINESS.md) - Production checklist

## Notes

- The repository already has comprehensive CI workflows and configurations
- Existing TypeScript errors are not addressed in this fix (out of scope)
- The host-agnostic guard allows some references in cleanup scripts and documentation
- Pre-commit hooks only run linting to avoid blocking commits due to existing type errors
