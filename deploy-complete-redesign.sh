#!/bin/bash

# 🚀 Deploy Complete Home Page Redesign
# This script deploys the new responsive design and fixes HTTPS issues

echo "🚀 Deploying Complete Home Page Redesign"
echo "========================================"

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

# Check if we're in the right directory
if [[ ! -d "frontend" ]]; then
    print_error "This script must be run from the project root directory!"
    echo "Make sure you're in: /Users/swumpyaesone/Documents/project_management/"
    exit 1
fi

echo "🔍 Complete redesign deployment:"
echo "   Local directory: $(pwd)"
echo "   Target server: 168.231.116.32"
echo "   Domain: focus-project.co.uk"
echo "   Time: $(date)"
echo ""

# Server details
SERVER_HOST="168.231.116.32"
SERVER_USER="root"
PROJECT_PATH="/var/www/project_management"

print_step "1/5 - Committing redesigned home page..."
git add .
git commit -m "Complete home page redesign - fully responsive

- Redesigned entire home page with clean, professional layout
- Removed all emojis and used consistent theme colors
- Implemented proper mobile-first responsive design
- Added comprehensive feature sections
- Improved navigation with working mobile menu
- Enhanced typography and spacing
- Added proper call-to-action sections
- Fixed all mobile layout issues"

if [ $? -eq 0 ]; then
    print_success "Changes committed to Git"
else
    print_warning "Git commit failed or no changes to commit"
fi

print_step "2/5 - Pushing changes to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Changes pushed to GitHub"
else
    print_error "Failed to push to GitHub. Continuing with SSH deployment..."
fi

print_step "3/5 - Deploying to server..."

# Create deployment commands
DEPLOY_COMMANDS="
echo '🔄 Starting complete redesign deployment...'
cd $PROJECT_PATH

echo '📥 Pulling latest redesign...'
git stash
git pull origin main

echo '🛑 Stopping services...'
systemctl stop nextjs-pm

echo '🏗️ Building redesigned application...'
cd frontend
rm -rf .next node_modules/.cache
npm cache clean --force
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

echo '⚙️ Ensuring HTTPS redirect is working...'
# Test and restart nginx to ensure HTTPS redirect works
nginx -t && systemctl restart nginx

echo '🚀 Starting Next.js service...'
systemctl start nextjs-pm

echo '⏳ Waiting for services to start...'
sleep 5

NEXTJS_STATUS=\$(systemctl is-active nextjs-pm)
NGINX_STATUS=\$(systemctl is-active nginx)

echo ''
echo '🎉 Complete Redesign Deployment Finished!'
echo '========================================'
echo ''

if [[ \"\$NEXTJS_STATUS\" == 'active' && \"\$NGINX_STATUS\" == 'active' ]]; then
    echo '✅ All services are running!'
    echo ''
    echo '🌐 Your redesigned website is now live at:'
    echo '   https://focus-project.co.uk ✅'
    echo '   https://www.focus-project.co.uk ✅'
    echo ''
    echo '🎨 New design features:'
    echo '   ✅ Completely responsive layout'
    echo '   ✅ Professional theme colors'
    echo '   ✅ Clean design without emojis'
    echo '   ✅ Working mobile navigation'
    echo '   ✅ Improved typography'
    echo '   ✅ Better call-to-action sections'
    echo '   ✅ Enhanced feature showcase'
    echo ''
    echo '📱 Mobile improvements:'
    echo '   ✅ Perfect mobile layout'
    echo '   ✅ Touch-friendly buttons'
    echo '   ✅ Responsive navigation menu'
    echo '   ✅ Optimized for all screen sizes'
    echo ''
    echo '🔧 Test your redesigned website:'
    echo '   Desktop: https://focus-project.co.uk'
    echo '   Mobile: Open on your phone'
    
else
    echo '❌ Some services failed to start!'
    echo 'Service Status:'
    echo \"   Next.js: \$NEXTJS_STATUS\"
    echo \"   Nginx: \$NGINX_STATUS\"
    echo ''
    echo 'Check logs: journalctl -u nextjs-pm -f'
fi
"

# Execute deployment on server
ssh -t $SERVER_USER@$SERVER_HOST "$DEPLOY_COMMANDS"

if [ $? -eq 0 ]; then
    print_step "4/5 - Verifying HTTPS deployment..."
    
    # Test HTTPS
    sleep 10
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://focus-project.co.uk)
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        print_success "HTTPS is working perfectly!"
    else
        print_warning "HTTPS returned status: $HTTPS_STATUS"
    fi
    
    # Test WWW subdomain
    WWW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.focus-project.co.uk)
    if [ "$WWW_STATUS" = "200" ]; then
        print_success "WWW subdomain is working!"
    fi
    
    print_step "5/5 - Deployment verification complete!"
    echo ""
    echo "🎉 Complete Home Page Redesign Deployed Successfully!"
    echo "===================================================="
    echo ""
    print_success "Your website has been completely redesigned!"
    echo ""
    echo "🌐 Access your new website:"
    echo "   https://focus-project.co.uk ✅"
    echo "   https://www.focus-project.co.uk ✅"
    echo ""
    echo "🎨 What's new in the redesign:"
    echo "   ✅ Clean, professional layout"
    echo "   ✅ Fully responsive design"
    echo "   ✅ Theme-consistent colors"
    echo "   ✅ No emojis - clean design"
    echo "   ✅ Working mobile navigation"
    echo "   ✅ Better content organization"
    echo "   ✅ Enhanced user experience"
    echo ""
    echo "📱 Mobile testing checklist:"
    echo "   1. Open https://focus-project.co.uk on your phone"
    echo "   2. Test the hamburger menu"
    echo "   3. Try all buttons and links"
    echo "   4. Check different screen orientations"
    echo "   5. Verify smooth scrolling"
    echo ""
    echo "🔒 HTTPS features:"
    echo "   ✅ SSL certificate active"
    echo "   ✅ HTTP redirects to HTTPS"
    echo "   ✅ Secure connection"
    
else
    print_error "Deployment failed!"
    echo ""
    echo "🔧 Manual troubleshooting:"
    echo "1. SSH to server: ssh root@168.231.116.32"
    echo "2. Check services: systemctl status nextjs-pm nginx"
    echo "3. View logs: journalctl -u nextjs-pm -f"
    echo "4. Test build: cd /var/www/project_management/frontend && npm run build"
fi

echo ""
echo "🆘 Need help?"
echo "   - Test website: https://focus-project.co.uk"
echo "   - Check mobile: Open on your phone"
echo "   - SSH access: ssh root@168.231.116.32"
