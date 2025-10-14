#!/bin/bash

# 🚀 DEPLOY COMPLETION CHECKBOX FROM LOCAL MACHINE
# This script connects to Hostinger and deploys the feature

echo "🚀 Deploying Completion Checkbox to Hostinger..."
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

# Check if SQL has been run
echo ""
echo "⚠️  IMPORTANT: Did you run the SQL in Supabase?"
echo "   File: RUN_THIS_SQL_NOW.sql"
echo "   URL: https://supabase.com/dashboard"
echo ""
read -p "Have you run the SQL script? (yes/no): " sql_done

if [[ $sql_done != "yes" && $sql_done != "y" ]]; then
    print_error "Please run the SQL script in Supabase first!"
    echo ""
    echo "📋 Quick Instructions:"
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Select project: bayyefskgflbyyuwrlgm"
    echo "3. Click: SQL Editor → New Query"
    echo "4. Copy contents from: RUN_THIS_SQL_NOW.sql"
    echo "5. Paste and click Run"
    echo "6. Then run this script again"
    echo ""
    exit 1
fi

print_success "SQL confirmed! Proceeding with deployment..."
echo ""

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

echo "🔨 Building frontend..."
cd frontend
rm -rf .next
npm install --quiet
npm run build

echo "🚀 Starting service..."
cd /var/www/project_management
systemctl start nextjs-pm

echo ""
echo "✅ ================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "✅ ================================================"
echo ""
echo "🌐 Check your site:"
echo "   https://focus-project.co.uk/content-calendar"
echo ""
echo "Features deployed:"
echo "   ✓ Completion checkbox column"
echo "   ✓ Green highlighting"
echo "   ✓ Database persistence"
echo ""
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    print_success "================================================"
    print_success "✅ DEPLOYMENT SUCCESSFUL!"
    print_success "================================================"
    echo ""
    echo "🧪 Test now:"
    echo "   1. Open: https://focus-project.co.uk/content-calendar"
    echo "   2. Navigate to a folder"
    echo "   3. Click a checkbox → Row turns green ✅"
    echo "   4. Refresh page → Green stays ✅"
    echo ""
else
    print_error "Deployment failed. Check the error messages above."
    exit 1
fi

