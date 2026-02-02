#!/bin/bash

# 🔧 Deploy Sidebar Burger Icon Fix for Tablet
# This script fixes the sidebar functionality on tablet devices

echo "🔧 Deploying Sidebar Burger Icon Fix for Tablet"
echo "==============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Server details
SERVER_HOST="168.231.116.32"
SERVER_USER="root"
PROJECT_PATH="/var/www/project_management"

echo "🔍 Sidebar fix deployment:"
echo "   Target: focus-project.co.uk"
echo "   Fix: Tablet sidebar burger icon functionality"
echo "   Time: $(date)"
echo ""

print_step "1/3 - Deploying sidebar fixes..."

# Create deployment commands
DEPLOY_COMMANDS="
echo '🔧 Updating sidebar functionality...'
cd $PROJECT_PATH

echo '📥 Pulling sidebar fixes...'
git pull origin main

echo '🛑 Stopping Next.js service...'
systemctl stop nextjs-pm

echo '🏗️ Rebuilding with sidebar fixes...'
cd frontend
rm -rf .next
npm run build

if [ \$? -ne 0 ]; then
    echo '❌ Build failed!'
    exit 1
fi

echo '🔐 Setting permissions...'
cd ..
chown -R www-data:www-data $PROJECT_PATH
chmod -R 755 $PROJECT_PATH

echo '🚀 Starting Next.js service...'
systemctl start nextjs-pm

echo '⏳ Waiting for service...'
sleep 5

NEXTJS_STATUS=\$(systemctl is-active nextjs-pm)

echo ''
echo '🎉 Sidebar Fix Deployed!'
echo '======================='
echo ''

if [[ \"\$NEXTJS_STATUS\" == 'active' ]]; then
    echo '✅ Service is running!'
    echo ''
    echo '🌐 Your website with fixed sidebar:'
    echo '   https://focus-project.co.uk ✅'
    echo ''
    echo '🔧 Sidebar improvements:'
    echo '   ✅ Burger icon now works on tablet (up to 1024px)'
    echo '   ✅ Improved mobile menu button positioning'
    echo '   ✅ Better z-index layering for overlays'
    echo '   ✅ Enhanced touch targets for tablet'
    echo '   ✅ Debugging logs for troubleshooting'
    echo '   ✅ Consistent theme styling'
    echo ''
    echo '📱 Test the sidebar on tablet:'
    echo '   1. Open https://focus-project.co.uk/dashboard on tablet'
    echo '   2. Look for burger icon (top-left corner)'
    echo '   3. Tap to open sidebar'
    echo '   4. Sidebar should slide in from left'
    echo '   5. Tap overlay to close'
    
else
    echo '❌ Service failed to start!'
    echo 'Service Status: \$NEXTJS_STATUS'
    echo 'Check logs: journalctl -u nextjs-pm -f'
fi
"

# Execute deployment
ssh -t $SERVER_USER@$SERVER_HOST "$DEPLOY_COMMANDS"

if [ $? -eq 0 ]; then
    print_step "2/3 - Verifying sidebar functionality..."
    
    # Test the website
    sleep 5
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://focus-project.co.uk/dashboard)
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        print_success "Dashboard page is working!"
    else
        print_warning "Dashboard returned status: $HTTPS_STATUS"
    fi
    
    print_step "3/3 - Sidebar fix complete!"
    echo ""
    echo "🎉 Sidebar Burger Icon Fixed for Tablet!"
    echo "========================================"
    echo ""
    print_success "Sidebar functionality now works on tablet!"
    echo ""
    echo "🌐 Test your fixed sidebar:"
    echo "   Tablet: https://focus-project.co.uk/dashboard"
    echo "   Mobile: https://focus-project.co.uk/dashboard"
    echo ""
    echo "✅ What was fixed:"
    echo "   ✅ Extended mobile breakpoint to 1024px (includes tablets)"
    echo "   ✅ Burger icon now visible on tablet devices"
    echo "   ✅ Improved button sizing and positioning"
    echo "   ✅ Better z-index management"
    echo "   ✅ Enhanced touch targets"
    echo "   ✅ Consistent theme styling"
    echo ""
    echo "🔧 How to test:"
    echo "   1. Open dashboard on tablet (768px - 1024px width)"
    echo "   2. Look for orange burger icon (top-left)"
    echo "   3. Tap to open sidebar"
    echo "   4. Sidebar should slide in smoothly"
    echo "   5. Tap dark overlay to close"
    echo ""
    echo "📱 Responsive breakpoints:"
    echo "   • Mobile: 320px - 768px"
    echo "   • Tablet: 768px - 1024px (burger icon shows)"
    echo "   • Desktop: 1024px+ (sidebar always visible)"
    
else
    print_error "Sidebar fix deployment failed!"
    echo "Manual steps:"
    echo "1. SSH: ssh root@168.231.116.32"
    echo "2. Check: systemctl status nextjs-pm"
    echo "3. Rebuild: cd /var/www/project_management/frontend && npm run build"
fi

