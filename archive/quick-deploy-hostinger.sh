#!/bin/bash

# 🚀 Quick Hostinger Deployment for Company Outreach
# Use this for immediate deployment

echo "🚀 Quick Deploy: Company Outreach Feature to Hostinger"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're on the server
if [[ ! -d "/var/www/project_management" ]]; then
    print_error "This script must be run on the Hostinger server!"
    echo "Run this on your server (168.231.116.32):"
    echo "ssh root@168.231.116.32"
    echo "cd /var/www/project_management"
    echo "./quick-deploy-hostinger.sh"
    exit 1
fi

print_step "1. Stopping services..."
systemctl stop nextjs-pm || print_warning "Service not running"

print_step "2. Updating code..."
cd /var/www/project_management
git pull origin main

print_step "3. Building frontend..."
cd frontend
rm -rf .next
npm install
npm run build

print_step "4. Setting permissions..."
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

print_step "5. Starting service..."
systemctl start nextjs-pm

print_step "6. Checking status..."
sleep 3

if systemctl is-active --quiet nextjs-pm; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🌐 Your app is running at:"
    echo "   http://168.231.116.32:3000"
    echo "   http://168.231.116.32"
    echo ""
    echo "🗄️ Don't forget to run the SQL scripts in Supabase:"
    echo "   1. fix_company_outreach_rls.sql"
    echo "   2. create_company_outreach_tables_safe.sql"
    echo "   3. add_admin_access.sql"
else
    print_error "❌ Deployment failed!"
    echo "Check logs: journalctl -u nextjs-pm -f"
fi 