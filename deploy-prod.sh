#!/bin/bash
# deploy-prod.sh - Safe deployment script for baselots.com
# Usage: ./deploy-prod.sh

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Production VPS details
VPS_HOST="root@157.245.161.10"
VPS_PATH="/var/www/baselots-master"
SSH_KEY="$HOME/.ssh/baselots-vps"

# Check if we're on the right branch
current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$current_branch" != "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not on main branch (current: $current_branch)${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build locally first to check for errors
echo "📦 Building locally..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Local build successful${NC}"

# Reminder about demo pages
echo ""
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT CHECKLIST:${NC}"
echo "   • KYC page will be HIDDEN (client-side only)"
echo "   • Token/Connect Wallet will be HIDDEN (client-side only)"
echo "   • HSP Demo will be HIDDEN (client-side only)"
echo "   • Contracts page will be HIDDEN (client-side only)"
echo ""
echo -e "${YELLOW}   Note: Pages are still accessible via direct URL.${NC}"
echo -e "${YELLOW}   To completely block them, add middleware.ts${NC}"
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Sync source files (excluding .next and node_modules)
echo "📤 Syncing source files to VPS..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='.next' \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
    ./src/ $VPS_HOST:$VPS_PATH/src/

# Build on VPS (required for Linux x64 compatibility)
echo "🔨 Building on VPS..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    $VPS_HOST "cd $VPS_PATH && npm install && npm run build"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ VPS build failed.${NC}"
    exit 1
fi

# Restart PM2
echo "🔄 Restarting application..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    $VPS_HOST "cd $VPS_PATH && pm2 restart baselots-dynamic"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "   Site: https://baselots.com"
echo ""
echo "   Verify:"
echo "   • KYC link hidden: curl -s https://baselots.com | grep -c 'KYC' || echo 'Hidden ✓'"
echo "   • Waitlist working: curl -X POST https://baselots.com/api/waitlist ..."
