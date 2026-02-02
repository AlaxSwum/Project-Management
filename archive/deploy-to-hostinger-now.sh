#!/bin/bash

# 🚀 DEPLOY TO HOSTINGER SERVER
# Run this script on your Hostinger server to deploy all fixes

echo "🚀 Deploying Password Manager Fixes to Hostinger..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if we're in the right directory
if [ ! -d "/var/www/project_management" ]; then
    echo "❌ Not in Hostinger server or wrong directory"
    echo "Please run this on your Hostinger server:"
    echo "ssh root@srv875725.hstgr.cloud"
    echo "cd /var/www/project_management"
    echo "./deploy-to-hostinger-now.sh"
    exit 1
fi

cd /var/www/project_management

print_status "Step 1: Stopping services..."
systemctl stop nextjs-pm || echo "Service not running"

print_status "Step 2: Pulling latest code..."
git pull origin main

print_status "Step 3: Clearing cache and rebuilding..."
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run build

print_status "Step 4: Setting permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

print_status "Step 5: Starting services..."
systemctl start nextjs-pm

# Check status
sleep 3
if systemctl is-active --quiet nextjs-pm; then
    print_success "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    print_success "🌐 Your app is running at: https://srv875725.hstgr.cloud"
    echo ""
    print_warning "⚠️  IMPORTANT: You still need to run the SQL script!"
    echo ""
    echo "📋 FINAL STEP:"
    echo "=============="
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Open SQL Editor"
    echo "3. Copy contents of: emergency-password-vault-fix.sql"
    echo "4. Paste and click 'Run'"
    echo "5. Password vault will work immediately!"
    echo ""
    print_success "🔐 After running SQL: Password manager with team sharing ready!"
else
    echo "❌ Service failed to start"
    echo "Check logs: journalctl -u nextjs-pm -f"
fi

