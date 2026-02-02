#!/bin/bash

# 🚀 DEPLOY LATEST CHANGES TO HOSTINGER
# Simple deployment script for latest changes

echo "🚀 Deploying Latest Changes to Hostinger Server..."
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

echo "🔧 Setting permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

echo "▶️  Starting services..."
systemctl start nextjs-pm

echo "⏱️  Waiting for service to start..."
sleep 5

if systemctl is-active --quiet nextjs-pm; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "🌐 Your app is running at: https://srv875725.hstgr.cloud"
else
    echo "❌ Service failed to start"
    journalctl -u nextjs-pm --no-pager -n 10
fi

ENDSSH

if [ $? -eq 0 ]; then
    print_success "🎉 LATEST CHANGES DEPLOYED SUCCESSFULLY!"
    echo ""
    print_success "🎯 DEPLOYED FEATURES:"
    echo "✅ Fixed Personal Tasks System"
    echo "✅ Complete Expense Management with user suggestions"
    echo "✅ Hierarchical Daily Reports (Project → Date → User)"
    echo "✅ Consistent mobile navigation"
    echo "✅ Responsive design improvements"
    echo ""
    print_warning "📋 DATABASE DEPLOYMENT NEEDED:"
    echo "Deploy the expense database schema in Supabase SQL Editor"
    echo "Check DEPLOY_LATEST_CHANGES_NOW.md for SQL scripts"
    echo ""
    print_warning "🔄 Clear browser cache: Ctrl+Shift+R"
else
    print_error "❌ Deployment failed!"
fi
