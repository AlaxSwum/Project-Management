#!/bin/bash

# 🚀 DEPLOY PAYROLL SYSTEM TO HOSTINGER
# This script deploys the new payroll generation feature

echo "🚀 Deploying Payroll System to Hostinger Server..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Connecting to Hostinger server..."

# SSH and deploy
ssh root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to Hostinger server..."
cd /var/www/project_management

echo "📥 Pulling latest changes..."
git pull origin main

echo "⏹️  Stopping services..."
systemctl stop nextjs-pm

echo "🧹 Clearing cache and rebuilding..."
cd frontend
rm -rf .next node_modules/.cache
npm cache clean --force
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔧 Setting permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

echo "▶️  Starting services..."
systemctl start nextjs-pm

echo "⏱️  Waiting for service to start..."
sleep 5

if systemctl is-active --quiet nextjs-pm; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo "🌐 https://srv875725.hstgr.cloud"
    echo ""
    echo "🎯 DEPLOYED:"
    echo "✅ Payroll Generation Page"
    echo "✅ UK Payroll with full tax calculations"
    echo "✅ Myanmar Payroll (simplified)"
    echo "✅ PDF Generation"
    echo "✅ Email Sending Functionality"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Run create_payroll_tables.sql in Supabase if not done"
    echo "2. Add users to payroll_members table for access"
    echo "3. Access /payroll page (admin-only)"
else
    echo "❌ Service failed to start"
    journalctl -u nextjs-pm --no-pager -n 20
    exit 1
fi

ENDSSH

if [ $? -eq 0 ]; then
    print_success "🎉 PAYROLL SYSTEM DEPLOYED SUCCESSFULLY!"
    echo ""
    echo "📋 Remember to:"
    echo "1. Run create_payroll_tables.sql in Supabase"
    echo "2. Clear browser cache to see the new Payroll link in sidebar"
    echo "3. Test the payroll generation at /payroll"
else
    print_error "❌ Deployment failed!"
    exit 1
fi

