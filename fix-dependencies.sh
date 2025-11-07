#!/bin/bash
#
# fix-dependencies.sh - Script to clean, reinstall, and audit dependencies
# This script performs a complete dependency refresh and security audit
#

set -e

echo "============================================"
echo "Dependency Fix and Security Audit"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Step 1: Cleaning node_modules and lock files..."
echo -e "${YELLOW}Removing node_modules...${NC}"
rm -rf node_modules

echo -e "${YELLOW}Removing package-lock.json...${NC}"
rm -f package-lock.json

echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

echo "Step 2: Installing fresh dependencies..."
echo -e "${YELLOW}Running npm install...${NC}"
npm install

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo "Step 3: Running security audit..."
echo -e "${YELLOW}Running npm audit...${NC}"
npm audit --production || {
  echo ""
  echo -e "${YELLOW}Note: Some vulnerabilities found.${NC}"
  echo "Review the audit report above."
  echo "To fix automatically (may cause breaking changes):"
  echo "  npm audit fix"
  echo "To force fix all issues:"
  echo "  npm audit fix --force"
  echo ""
}

echo "Step 4: Checking for outdated packages..."
echo -e "${YELLOW}Running npm outdated...${NC}"
npm outdated || {
  echo ""
  echo -e "${YELLOW}Note: Some packages are outdated.${NC}"
  echo "Review the list above."
  echo "To update packages:"
  echo "  npm update"
  echo "To update to latest major versions:"
  echo "  npm update --latest"
  echo ""
}

echo "============================================"
echo -e "${GREEN}✓ Dependency fix complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Review the audit report for any critical vulnerabilities"
echo "  2. Run: npm test"
echo "  3. Run: npm run build"
echo ""
