#!/bin/bash

# 🚀 DEPLOY ENHANCED TIMELINE PAGE TO HOSTINGER
# This script deploys the redesigned timeline page with modern UI

echo "🚀 Deploying Enhanced Timeline Page to Hostinger..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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

# Hostinger server details
SERVER="srv875725.hstgr.cloud"
USER="root"
PROJECT_DIR="/var/www/project_management"

print_step "Connecting to Hostinger server: $SERVER"
echo ""

# SSH and deploy
ssh -t $USER@$SERVER << 'ENDSSH'
cd /var/www/project_management

echo "🔄 Pulling latest code from GitHub..."
git pull origin main

echo "🛑 Stopping service..."
systemctl stop nextjs-pm || echo "Service not running"

echo "📦 Installing dependencies..."
cd hostinger_deployment_v2
npm install --quiet

echo "🔨 Building application..."
rm -rf .next
npm run build

echo "🔐 Setting permissions..."
cd /var/www/project_management
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

echo "🚀 Starting service..."
systemctl start nextjs-pm

echo ""
sleep 3

if systemctl is-active --quiet nextjs-pm; then
    echo "✅ ================================================"
    echo "✅ DEPLOYMENT COMPLETE!"
    echo "✅ ================================================"
    echo ""
    echo "🌐 Your timeline page is live at:"
    echo "   https://focus-project.co.uk/timeline"
    echo "   https://srv875725.hstgr.cloud/timeline"
    echo ""
    echo "🎨 New features deployed:"
    echo "   ✓ Stunning gradient backgrounds"
    echo "   ✓ Enhanced KPI dashboard cards"
    echo "   ✓ Improved Gantt chart design"
    echo "   ✓ Animated timeline items"
    echo "   ✓ Better visual hierarchy"
    echo "   ✓ Modern glassmorphism effects"
    echo ""
else
    echo "❌ Service failed to start"
    echo "📋 Check logs: journalctl -u nextjs-pm -f"
    exit 1
fi

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    print_success "================================================"
    print_success "✅ DEPLOYMENT SUCCESSFUL!"
    print_success "================================================"
    echo ""
    echo "🧪 Test the new design:"
    echo "   1. Open: https://focus-project.co.uk/timeline"
    echo "   2. Check the beautiful gradient header"
    echo "   3. View the enhanced KPI cards"
    echo "   4. Explore the improved Gantt chart"
    echo "   5. Hover over items to see animations"
    echo ""
else
    print_error "Deployment failed. Check the error messages above."
    exit 1
fi
