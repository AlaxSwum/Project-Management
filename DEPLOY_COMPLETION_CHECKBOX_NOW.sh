#!/bin/bash

# 🚀 DEPLOY COMPLETION CHECKBOX FEATURE TO HOSTINGER
# This script pulls the latest code and rebuilds the frontend

echo "🚀 Deploying Completion Checkbox Feature..."
echo "============================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running on Hostinger server
if [ ! -d "/var/www/project_management" ]; then
    print_error "Not on Hostinger server!"
    echo ""
    echo "To deploy, SSH to your Hostinger server:"
    echo ""
    echo "  ssh root@srv875725.hstgr.cloud"
    echo "  cd /var/www/project_management"
    echo "  ./DEPLOY_COMPLETION_CHECKBOX_NOW.sh"
    echo ""
    exit 1
fi

cd /var/www/project_management

print_status "Step 1: Stopping Next.js service..."
systemctl stop nextjs-pm || print_warning "Service not running"

print_status "Step 2: Pulling latest code from GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    print_error "Failed to pull from GitHub"
    exit 1
fi

print_success "Code pulled successfully"

print_status "Step 3: Rebuilding frontend..."
cd frontend

print_status "  - Clearing cache..."
rm -rf .next

print_status "  - Installing dependencies..."
npm install

print_status "  - Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_success "Build completed successfully"

print_status "Step 4: Starting Next.js service..."
cd /var/www/project_management
systemctl start nextjs-pm

print_status "Step 5: Checking service status..."
sleep 3
systemctl status nextjs-pm --no-pager

echo ""
print_success "============================================"
print_success "✅ DEPLOYMENT COMPLETE!"
print_success "============================================"
echo ""
echo "🎯 Features Deployed:"
echo "   ✓ Completion checkbox column"
echo "   ✓ Green highlighting for completed items"
echo "   ✓ Database persistence"
echo ""
echo "🌐 Check your site:"
echo "   https://focus-project.co.uk/content-calendar"
echo ""
echo "⚠️  IMPORTANT: Did you run the SQL script in Supabase?"
echo "   If not, run: ADD_COMPLETION_CHECKBOX_TO_CONTENT_CALENDAR.sql"
echo ""

