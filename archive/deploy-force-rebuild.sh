#!/bin/bash

# 🔄 Force Rebuild Deployment Script for Hostinger
# This script clears build cache and forces a complete rebuild

set -e

echo "🚀 Starting Force Rebuild Deployment to Hostinger..."
echo "📅 Time: $(date)"

# Server details
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_USER="root"

echo "🔌 Connecting to $SERVER_HOST..."

# SSH into server and run deployment commands
ssh -t $SERVER_USER@$SERVER_HOST << 'ENDSSH'
echo "📍 Connected to Hostinger server"
echo "📅 Server time: $(date)"

# Navigate to project directory
cd /var/www/project_management

echo "💾 Stashing any local changes..."
git stash push -m "Auto-stash before deployment $(date)"

echo "📥 Force pulling latest changes from GitHub..."
git fetch origin main
git reset --hard origin/main

echo "✅ Repository updated successfully"

# Navigate to frontend
cd frontend

echo "🧹 Clearing Next.js build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

echo "📦 Reinstalling dependencies..."
rm -rf node_modules
npm install

echo "🔨 Building application with fresh cache..."
npm run build

# Restart the service
echo "🔄 Restarting Next.js service..."
systemctl restart nextjs-pm

# Check service status
echo "✅ Checking service status..."
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ Next.js service is running successfully!"
else
    echo "❌ Next.js service failed to start"
    echo "📋 Service logs:"
    journalctl -u nextjs-pm --no-pager -n 10
    exit 1
fi

echo ""
echo "🎉 Force rebuild deployment completed successfully!"
echo "🌐 Application is running at: https://srv875725.hstgr.cloud"
echo ""
echo "🔧 Styling fixes deployed:"
echo "- New color theme: F5F5ED background, FFB333 primary, 5884FD secondary"
echo "- Modern professional project management appearance"
echo "- Enhanced buttons, forms, and user interface elements"
echo "- Cleared build cache to ensure fresh styles load"
echo ""
ENDSSH

echo ""
echo "✅ Force rebuild deployment completed!"
echo "🌐 Your application should now have the updated styling at: https://srv875725.hstgr.cloud"
echo ""
echo "🧪 Test the new theme:"
echo "1. Visit: https://srv875725.hstgr.cloud"
echo "2. Check the new cream background (F5F5ED)"
echo "3. Test login/register pages with new styling"
echo "4. Verify buttons use the new yellow primary color (FFB333)"
echo "" 