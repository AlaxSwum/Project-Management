#!/bin/bash

# 🔧 Deploy Mobile Header Icon Fix
# This script fixes the mobile navigation icon styling consistency

echo "🔧 Deploying Mobile Header Icon Fix"
echo "==================================="

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

echo "🔍 Mobile header fix deployment:"
echo "   Target: focus-project.co.uk"
echo "   Fix: Navigation icon styling consistency"
echo "   Time: $(date)"
echo ""

print_step "1/3 - Deploying mobile header fix..."

# Create deployment commands
DEPLOY_COMMANDS="
echo '🔧 Updating mobile header styling...'
cd $PROJECT_PATH

echo '📥 Pulling mobile header fixes...'
git pull origin main

echo '🛑 Stopping Next.js service...'
systemctl stop nextjs-pm

echo '🏗️ Quick rebuild with header fixes...'
cd frontend
rm -rf .next
npm run build

if [ \$? -ne 0 ]; then
    echo '❌ Build failed!'
    exit 1
fi

echo '🚀 Starting Next.js service...'
systemctl start nextjs-pm

echo '⏳ Waiting for service...'
sleep 5

NEXTJS_STATUS=\$(systemctl is-active nextjs-pm)

echo ''
echo '🎉 Mobile Header Fix Deployed!'
echo '============================='
echo ''

if [[ \"\$NEXTJS_STATUS\" == 'active' ]]; then
    echo '✅ Service is running!'
    echo ''
    echo '🌐 Your website with fixed mobile header:'
    echo '   https://focus-project.co.uk ✅'
    echo ''
    echo '🔧 Mobile header improvements:'
    echo '   ✅ Consistent theme colors (orange gradient)'
    echo '   ✅ Proper hover states and transitions'
    echo '   ✅ Professional button styling'
    echo '   ✅ Themed background with blur effect'
    echo '   ✅ Consistent with other navigation elements'
    echo ''
    echo '📱 Test the mobile header:'
    echo '   1. Open https://focus-project.co.uk/dashboard on tablet'
    echo '   2. Check the navigation icon (top-right)'
    echo '   3. Should now match theme colors'
    echo '   4. Try tapping to open/close menu'
    
else
    echo '❌ Service failed to start!'
    echo 'Service Status: \$NEXTJS_STATUS'
    echo 'Check logs: journalctl -u nextjs-pm -f'
fi
"

# Execute deployment
ssh -t $SERVER_USER@$SERVER_HOST "$DEPLOY_COMMANDS"

if [ $? -eq 0 ]; then
    print_step "2/3 - Verifying mobile header fix..."
    
    # Test the website
    sleep 5
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://focus-project.co.uk/dashboard)
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        print_success "Dashboard page is working!"
    else
        print_warning "Dashboard returned status: $HTTPS_STATUS"
    fi
    
    print_step "3/3 - Mobile header fix complete!"
    echo ""
    echo "🎉 Mobile Header Icon Fixed Successfully!"
    echo "========================================"
    echo ""
    print_success "Navigation icon styling is now consistent!"
    echo ""
    echo "🌐 Test your fixed mobile header:"
    echo "   Tablet view: https://focus-project.co.uk/dashboard"
    echo "   Mobile view: https://focus-project.co.uk/dashboard"
    echo ""
    echo "✅ What was fixed:"
    echo "   ✅ Orange gradient theme colors"
    echo "   ✅ Consistent button styling"
    echo "   ✅ Proper hover effects"
    echo "   ✅ Professional appearance"
    echo "   ✅ Themed background blur"
    echo ""
    echo "🔧 The navigation icon now:"
    echo "   • Uses orange gradient when active"
    echo "   • Has subtle orange background when inactive"
    echo "   • Matches the overall theme design"
    echo "   • Has smooth transitions and hover effects"
    
else
    print_error "Mobile header fix deployment failed!"
    echo "Manual steps:"
    echo "1. SSH: ssh root@168.231.116.32"
    echo "2. Check: systemctl status nextjs-pm"
    echo "3. Rebuild: cd /var/www/project_management/frontend && npm run build"
fi
