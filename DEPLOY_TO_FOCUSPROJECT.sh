#!/bin/bash

# ========================================
# DEPLOY EMAIL TRACKING TO FOCUS PROJECT
# focus-project.co.uk (168.231.116.32)
# ========================================

echo "=========================================="
echo "EMAIL TRACKING - Deploy to Focus Project"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Server details
SERVER_HOST="168.231.116.32"
SERVER_USER="root"
DOMAIN="focus-project.co.uk"
PROJECT_PATH="/var/www/project_management"

echo -e "${BLUE}Target:${NC} $DOMAIN ($SERVER_HOST)"
echo ""

read -p "Deploy Email Tracking to Focus Project? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1/4:${NC} Connecting to server..."

# Create deployment commands
DEPLOY_COMMANDS="
echo '🚀 Deploying Email Tracking to Focus Project...'
echo '=============================================='

cd $PROJECT_PATH

echo '📥 Pulling latest code...'
git pull origin main

echo '🏗️  Building frontend...'
cd frontend
npm install
npm run build

if [ \$? -ne 0 ]; then
    echo '❌ Build failed!'
    exit 1
fi

echo '🔐 Setting permissions...'
cd ..
chown -R www-data:www-data $PROJECT_PATH
chmod -R 755 $PROJECT_PATH

echo '🔄 Restarting service...'
systemctl restart nextjs-pm

echo '⏳ Waiting for service...'
sleep 3

NEXTJS_STATUS=\$(systemctl is-active nextjs-pm)

echo ''
if [[ \"\$NEXTJS_STATUS\" == 'active' ]]; then
    echo '✅ Deployment successful!'
    echo ''
    echo '🌐 Email Tracking is now live at:'
    echo '   https://focus-project.co.uk/email-tracking'
    echo ''
    echo '📍 Location in Sidebar:'
    echo '   Home'
    echo '   My Tasks'
    echo '   Calendar'
    echo '   My Personal'
    echo '   Timeline & Roadmap'
    echo '   Expenses'
    echo '   Password Vault'
    echo '   → Email Tracking  ✅ (with envelope icon)'
    echo '   Timetable'
    echo '   Reporting'
    echo ''
else
    echo '❌ Service failed to start!'
    echo 'Status: '\$NEXTJS_STATUS
    echo 'Check logs: journalctl -u nextjs-pm -f'
    exit 1
fi
"

# Execute deployment
ssh -t $SERVER_USER@$SERVER_HOST "$DEPLOY_COMMANDS"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✅ DEPLOYMENT COMPLETE!"
    echo "==========================================${NC}"
    echo ""
    echo "🌐 Visit Email Tracking at:"
    echo "   https://focus-project.co.uk/email-tracking"
    echo ""
    echo "📱 Sidebar Location:"
    echo "   Password Vault"
    echo "   → Email Tracking (envelope icon) ✅"
    echo "   Timetable"
    echo ""
    echo -e "${YELLOW}🗄️  IMPORTANT: Deploy Database!${NC}"
    echo "=========================================="
    echo ""
    echo "Don't forget to run the SQL in Supabase:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Open SQL Editor"
    echo "3. Copy ALL from: create_email_tracking_system.sql"
    echo "4. Paste and click 'Run'"
    echo ""
    echo "Then create your first folder:"
    echo "1. Visit: https://focus-project.co.uk/email-tracking"
    echo "2. Click 'New Year Folder'"
    echo "3. Enter: 2025"
    echo "4. Start tracking emails!"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Deployment had issues${NC}"
    echo ""
    echo "Manual deployment:"
    echo "ssh root@168.231.116.32"
    echo "cd /var/www/project_management"
    echo "git pull origin main"
    echo "cd frontend && npm run build && cd .."
    echo "systemctl restart nextjs-pm"
fi

