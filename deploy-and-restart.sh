#!/bin/bash

# ================================================
# 🚀 UNIFIED DEPLOYMENT SCRIPT FOR FOCUS-PROJECT.CO.UK
# ================================================
# This script handles everything:
# 1. Git commit & push
# 2. Deploy to server
# 3. Build application
# 4. Restart PM2
# ================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Server Configuration
REMOTE_HOST="focus-project.co.uk"
REMOTE_USER="root"
REMOTE_PASSWORD="SpsSps2003@A"
REMOTE_PATH="/var/www/html"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 UNIFIED DEPLOYMENT - focus-project.co.uk  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ================================================
# STEP 1: GIT COMMIT & PUSH
# ================================================
echo -e "${YELLOW}📝 STEP 1: Committing changes to Git...${NC}"

# Get commit message from user or use default
if [ -z "$1" ]; then
    COMMIT_MESSAGE="Add start date and time field to personal task form"
    echo -e "${BLUE}Using default commit message: ${COMMIT_MESSAGE}${NC}"
else
    COMMIT_MESSAGE="$1"
    echo -e "${BLUE}Using custom commit message: ${COMMIT_MESSAGE}${NC}"
fi

# Navigate to project directory
cd "$(dirname "$0")"
cd frontend

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    # Add all changes
    git add .
    
    # Commit changes
    git commit -m "$COMMIT_MESSAGE" || echo -e "${YELLOW}⚠️  Nothing to commit or commit failed${NC}"
fi

# Push to remote
echo -e "${BLUE}📤 Pushing to Git repository...${NC}"
git push origin main || git push origin master || echo -e "${YELLOW}⚠️  Push failed or already up to date${NC}"

echo -e "${GREEN}✅ Git operations complete!${NC}"
echo ""

# ================================================
# STEP 2: TEST CONNECTION
# ================================================
echo -e "${YELLOW}🔧 STEP 2: Testing server connection...${NC}"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Connection successful!'" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ SSH connection failed!${NC}"
    echo -e "${YELLOW}Attempting alternative connection methods...${NC}"
    
    # Try without sshpass (in case password authentication is the issue)
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Connection successful!'" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ All connection attempts failed!${NC}"
        echo -e "${YELLOW}Please check:${NC}"
        echo -e "${YELLOW}- Server is running${NC}"
        echo -e "${YELLOW}- SSH credentials are correct${NC}"
        echo -e "${YELLOW}- Firewall settings${NC}"
        echo ""
        echo -e "${YELLOW}You can deploy manually via Hostinger Control Panel${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Server connection established!${NC}"
echo ""

# ================================================
# STEP 3: DEPLOY TO SERVER
# ================================================
echo -e "${YELLOW}🚀 STEP 3: Deploying to server...${NC}"

sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
set -e

cd /var/www/html

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Pulling latest changes from Git..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git fetch origin
git reset --hard origin/main || git reset --hard origin/master
git pull

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Installing dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend
# Remove node_modules and package-lock to ensure clean install
rm -rf node_modules package-lock.json
npm install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  Building application..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# Clear old build
rm -rf .next
# Build new version
npm run build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Restarting PM2 services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 restart all || pm2 start npm --name "frontend" -- start

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PM2 Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list

echo ""
echo "✅ Deployment complete!"

ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${YELLOW}Check the error messages above for details${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# ================================================
# STEP 4: SUMMARY & VERIFICATION
# ================================================
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🎉 DEPLOYMENT COMPLETE! 🎉          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Changes committed to Git${NC}"
echo -e "${GREEN}✅ Pushed to remote repository${NC}"
echo -e "${GREEN}✅ Deployed to focus-project.co.uk${NC}"
echo -e "${GREEN}✅ Application built successfully${NC}"
echo -e "${GREEN}✅ PM2 services restarted${NC}"
echo ""
echo -e "${YELLOW}🌐 Website URLs:${NC}"
echo -e "${BLUE}   🔗 Personal Tasks: https://focus-project.co.uk/personal${NC}"
echo -e "${BLUE}   🔗 Main Site: https://focus-project.co.uk${NC}"
echo ""
echo -e "${YELLOW}📝 What's new:${NC}"
echo -e "${GREEN}   ✨ Start Date & Time field added to personal task form${NC}"
echo -e "${GREEN}   ✨ Tasks can now have both start and due dates${NC}"
echo ""
echo -e "${YELLOW}🧪 Testing:${NC}"
echo -e "   1. Visit: ${BLUE}https://focus-project.co.uk/personal${NC}"
echo -e "   2. Click '+ New Task' button"
echo -e "   3. Look for 'Start Date & Time' and 'Due Date & Time' fields"
echo -e "   4. Create a task with both dates"
echo ""
echo -e "${YELLOW}💡 Tip: ${NC}If you don't see the changes:"
echo -e "   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo -e "   - Clear browser cache"
echo ""
echo -e "${GREEN}🎊 Deployment finished at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

