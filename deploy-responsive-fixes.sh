#!/bin/bash

# 📱 Deploy Responsive Home Page Fixes
# This script deploys the responsive design improvements to your server

echo "📱 Deploying Responsive Home Page Fixes"
echo "======================================="

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

# Check if running on server
if [[ ! -d "/var/www/project_management" ]]; then
    print_error "This script must be run on your Hostinger server!"
    echo ""
    echo "To deploy responsive fixes:"
    echo "1. SSH into your server: ssh root@168.231.116.32"
    echo "2. Navigate to project: cd /var/www/project_management"
    echo "3. Run this script: ./deploy-responsive-fixes.sh"
    echo ""
    echo "Or run the complete setup:"
    echo "wget https://raw.githubusercontent.com/AlaxSwum/Project-Management/main/deploy-responsive-fixes.sh"
    echo "chmod +x deploy-responsive-fixes.sh"
    echo "sudo ./deploy-responsive-fixes.sh"
    exit 1
fi

echo "🔍 Current setup:"
echo "   Server: $(hostname)"
echo "   Project: /var/www/project_management"
echo "   Time: $(date)"
echo ""

# STEP 1: Stop services
print_step "1/6 - Stopping services..."
systemctl stop nextjs-pm || print_warning "Next.js service not running"

# STEP 2: Pull latest changes
print_step "2/6 - Pulling latest responsive fixes from GitHub..."
cd /var/www/project_management
git pull origin main

if [ $? -ne 0 ]; then
    print_error "Failed to pull latest changes from GitHub"
    print_warning "Continuing with local files..."
fi

# STEP 3: Navigate to frontend and clean build
print_step "3/6 - Cleaning previous build..."
cd frontend
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# STEP 4: Install dependencies and build
print_step "4/6 - Installing dependencies..."
npm install

print_step "5/6 - Building with responsive improvements..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed! Check for errors above."
    exit 1
fi

print_success "Build completed successfully!"

# STEP 5: Set permissions
print_step "Setting proper permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

# STEP 6: Start services
print_step "6/6 - Starting services..."
systemctl start nextjs-pm

# Check service status
sleep 3
if systemctl is-active --quiet nextjs-pm; then
    print_success "Next.js service started successfully!"
else
    print_error "Next.js service failed to start!"
    echo "Check logs: journalctl -u nextjs-pm -f"
    exit 1
fi

# Final status check
echo ""
echo "🎉 Responsive Fixes Deployed Successfully!"
echo "=========================================="
echo ""
print_success "All services are running!"
echo ""
echo "📱 Responsive improvements deployed:"
echo "   ✅ Mobile navigation menu"
echo "   ✅ Responsive hero section"
echo "   ✅ Mobile-optimized buttons"
echo "   ✅ Responsive feature cards"
echo "   ✅ Mobile-friendly footer"
echo "   ✅ Improved text sizing"
echo "   ✅ Touch-friendly interactions"
echo ""
echo "🌐 Test your responsive website:"
echo "   Desktop: http://168.231.116.32"
echo "   Mobile: Open on your phone"
echo ""
echo "🔧 What was improved:"
echo "   • Added hamburger menu for mobile"
echo "   • Fixed button sizing and spacing"
echo "   • Improved text readability on small screens"
echo "   • Made feature cards stack properly"
echo "   • Enhanced touch targets"
echo "   • Added proper mobile breakpoints"
echo ""
echo "📊 Test on different screen sizes:"
echo "   • Phone (320px - 480px)"
echo "   • Tablet (768px - 1024px)"
echo "   • Desktop (1024px+)"
echo ""

# Show current status
NEXTJS_STATUS=$(systemctl is-active nextjs-pm)
NGINX_STATUS=$(systemctl is-active nginx)

echo "🔍 Service Status:"
echo "   Next.js: $NEXTJS_STATUS"
echo "   Nginx: $NGINX_STATUS"

if [[ "$NEXTJS_STATUS" == "active" ]]; then
    echo ""
    print_success "🚀 Your responsive website is now live!"
    echo "Visit: http://168.231.116.32"
    echo ""
    echo "📱 Mobile testing tips:"
    echo "   1. Open on your phone"
    echo "   2. Try the hamburger menu"
    echo "   3. Test button interactions"
    echo "   4. Check text readability"
    echo "   5. Verify smooth scrolling"
else
    print_error "Service issues detected. Check logs:"
    echo "journalctl -u nextjs-pm -f"
fi

echo ""
echo "🆘 Need help?"
echo "   - Check logs: journalctl -u nextjs-pm -f"
echo "   - Restart services: systemctl restart nextjs-pm nginx"
echo "   - Test locally: curl http://localhost:3000"
