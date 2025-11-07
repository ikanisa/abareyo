#!/bin/bash
#
# fix-host-agnostic.sh - Script to find and report Vercel/Render-specific references
# This script searches for platform-specific references and reports them for manual review
#

set -e

echo "=================================================="
echo "Host-Agnostic Guard - Platform Reference Scanner"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for found references
found_count=0

echo "Searching for Vercel-specific references..."
if vercel_results=$(grep -rn "vercel" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.mjs" \
  --include="*.cjs" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  . 2>/dev/null); then
  echo -e "${YELLOW}Found Vercel references:${NC}"
  echo "$vercel_results"
  found_count=$((found_count + $(echo "$vercel_results" | wc -l)))
  echo ""
fi

echo "Searching for Render-specific references..."
if render_results=$(grep -rn "render\.com\|render-" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.mjs" \
  --include="*.cjs" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  . 2>/dev/null); then
  echo -e "${YELLOW}Found Render references:${NC}"
  echo "$render_results"
  found_count=$((found_count + $(echo "$render_results" | wc -l)))
  echo ""
fi

echo "Searching for Heroku-specific references..."
if heroku_results=$(grep -rn "heroku" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.mjs" \
  --include="*.cjs" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  . 2>/dev/null); then
  echo -e "${YELLOW}Found Heroku references:${NC}"
  echo "$heroku_results"
  found_count=$((found_count + $(echo "$heroku_results" | wc -l)))
  echo ""
fi

echo "=================================================="
if [ $found_count -eq 0 ]; then
  echo -e "${GREEN}✓ No platform-specific references found!${NC}"
  echo "Repository is host-agnostic."
  exit 0
else
  echo -e "${RED}✗ Found $found_count platform-specific reference(s)${NC}"
  echo ""
  echo "Please review and replace platform-specific code with generic alternatives:"
  echo "  - Use environment variables instead of platform detection"
  echo "  - Use standard deployment patterns"
  echo "  - Avoid platform-specific APIs"
  echo ""
  echo "Note: The existing host_agnostic_guard.ts provides automated checks."
  echo "Run: npx tsx scripts/host_agnostic_guard.ts"
  exit 1
fi
