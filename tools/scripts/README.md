# Tools and Scripts

This directory contains development and operational tooling for the Abareyo project.

## Available Scripts

### `check-client-secrets.mjs`

Security scanner that detects server-only environment variable names in client-facing code.

**Purpose:** Prevent accidental exposure of server secrets (API keys, tokens, etc.) to the browser bundle.

**Usage:**
```bash
node tools/scripts/check-client-secrets.mjs
```

**Exit Codes:**
- `0` - No violations found (clean)
- `1` - Violations detected (server secrets found in client code)
- `2` - Fatal error (scanner failure)

**What It Scans:**
- `app/` - Next.js app directory (excluding API routes)
- `src/` - Shared source code (excluding lib/server and services/admin)
- `public/` - Static assets

**What It Looks For:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `ADMIN_SESSION_SECRET`
- `FAN_SESSION_SECRET`
- `ONBOARDING_API_TOKEN`
- And other server-only secrets

**Integration:**
- Runs automatically in CI via `.github/workflows/ci-secret-guard.yml`
- Can be added to pre-commit hooks for local enforcement

**Example Output (Clean):**
```
🔍 Scanning for server-only secrets in client code...

Scanning app/...
  ✓ Scanned 295 files

Scanning src/...
  ✓ Scanned 177 files

Scanning public/...
  ✓ Scanned 8 files

✅ No server-only secrets found in client code!
```

**Example Output (Violations):**
```
❌ SECURITY VIOLATIONS DETECTED:

Found 2 reference(s) to server-only secrets in client code:

📁 src/components/client-component.tsx
   Line 15: OPENAI_API_KEY
      const apiKey = process.env.OPENAI_API_KEY;

Server-only secrets must NEVER appear in client code...
```

**How to Fix Violations:**
1. Remove the server-only secret reference from client code
2. Move the logic to an API route or server component
3. Use a NEXT_PUBLIC_* variable if the value is truly client-safe
4. Re-run the scanner to verify the fix

## Other Tools

### `generate-route-map.mjs`

Located in `tools/` (parent directory). Generates a route map for the application.

See the main tools directory for additional development utilities.
