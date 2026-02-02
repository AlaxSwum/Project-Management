#!/bin/bash

# 🚀 Deploy Responsive Fixes from Local Machine
# Run this script from your local project directory

echo "🚀 Deploying Responsive Fixes from Local Machine"
echo "================================================"

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

echo "🔍 Local deployment setup:"
echo "   Local directory: $(pwd)"
echo "   Target server: 168.231.116.32"
echo "   Time: $(date)"
echo ""

# Server details
SERVER_HOST="168.231.116.32"
SERVER_USER="root"
PROJECT_PATH="/var/www/project_management"

print_step "1/6 - Checking local changes..."
if [[ -f "frontend/src/app/page.tsx" ]]; then
    print_success "Responsive home page found"
else
    print_error "Home page not found. Make sure responsive fixes are applied."
    exit 1
fi

print_step "2/6 - Committing local changes to Git..."
git add .
git commit -m "🔧 Fix responsive design for home page

- Add mobile navigation menu with hamburger
- Implement responsive hero section
- Fix button sizing and spacing for mobile
- Optimize feature cards for small screens
- Improve footer layout on mobile
- Add proper mobile breakpoints
- Enhance touch targets and interactions"

if [ $? -eq 0 ]; then
    print_success "Changes committed to Git"
else
    print_warning "Git commit failed or no changes to commit"
fi

print_step "3/6 - Pushing changes to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Changes pushed to GitHub"
else
    print_error "Failed to push to GitHub. Continuing with SSH deployment..."
fi

print_step "4/6 - Connecting to server and deploying..."

# Create deployment commands
DEPLOY_COMMANDS="
echo '🔄 Starting server-side deployment...'
cd $PROJECT_PATH

echo '📥 Pulling latest changes...'
git pull origin main

echo '🛑 Stopping services...'
systemctl stop nextjs-pm

echo '🏗️ Building with responsive fixes...'
cd frontend
rm -rf .next
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

echo '🚀 Starting services...'
systemctl start nextjs-pm

echo '⏳ Waiting for service to start...'
sleep 5

if systemctl is-active --quiet nextjs-pm; then
    echo '✅ Deployment successful!'
    echo '🌐 Website is live at: http://168.231.116.32'
    echo ''
    echo '📱 Responsive features deployed:'
    echo '   ✅ Mobile navigation menu'
    echo '   ✅ Responsive hero section'
    echo '   ✅ Mobile-optimized buttons'
    echo '   ✅ Touch-friendly interactions'
    echo '   ✅ Responsive feature cards'
    echo '   ✅ Mobile-friendly footer'
    echo ''
    echo '🔧 Test your responsive website:'
    echo '   Desktop: http://168.231.116.32'
    echo '   Mobile: Open on your phone'
else
    echo '❌ Service failed to start!'
    echo 'Check logs: journalctl -u nextjs-pm -f'
    exit 1
fi
"

# Execute deployment on server
ssh -t $SERVER_USER@$SERVER_HOST "$DEPLOY_COMMANDS"

if [ $? -eq 0 ]; then
    print_step "5/6 - Verifying deployment..."
    
    # Test if website is responding
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://168.231.116.32)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Website is responding correctly!"
    else
        print_warning "Website returned status: $HTTP_STATUS"
    fi
    
    print_step "6/6 - Deployment complete!"
    echo ""
    echo "🎉 Responsive Deployment Successful!"
    echo "==================================="
    echo ""
    print_success "Your responsive website is now live!"
    echo ""
    echo "🌐 Access your website:"
    echo "   Desktop: http://168.231.116.32"
    echo "   Mobile: http://168.231.116.32 (test on your phone)"
    echo ""
    echo "📱 What's been improved:"
    echo "   ✅ Mobile hamburger menu"
    echo "   ✅ Responsive text sizing"
    echo "   ✅ Touch-friendly buttons"
    echo "   ✅ Mobile-optimized layout"
    echo "   ✅ Improved readability"
    echo "   ✅ Better spacing on small screens"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Open http://168.231.116.32 on your phone"
    echo "   2. Test the hamburger menu"
    echo "   3. Try different screen orientations"
    echo "   4. Check button interactions"
    echo ""
    echo "🆘 If you need help:"
    echo "   - SSH to server: ssh root@168.231.116.32"
    echo "   - Check logs: journalctl -u nextjs-pm -f"
    echo "   - Restart service: systemctl restart nextjs-pm"
    
else
    print_error "Deployment failed!"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check SSH connection: ssh root@168.231.116.32"
    echo "2. Verify server status manually"
    echo "3. Check if services are running"
    echo ""
    echo "Manual deployment commands:"
    echo "ssh root@168.231.116.32"
    echo "cd /var/www/project_management"
    echo "git pull origin main"
    echo "cd frontend && npm run build"
    echo "systemctl restart nextjs-pm"
fi
