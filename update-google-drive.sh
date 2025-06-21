#!/bin/bash

# Quick update script for Google Drive integration fixes
# Run this on your server: srv875725.hstgr.cloud

echo "🔄 Updating Google Drive integration..."

# Navigate to the application directory
cd /var/www/project_management

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Update frontend
echo "🏗️ Rebuilding frontend..."
cd frontend
npm install
npm run build

# Restart the service
echo "🔄 Restarting service..."
systemctl restart nextjs-pm

# Check status
echo "✅ Checking service status..."
systemctl status nextjs-pm --no-pager -l | head -5

echo ""
echo "🎉 Google Drive integration updated!"
echo "🌐 Your application is available at: https://srv875725.hstgr.cloud"
echo ""
echo "🔧 If you need to check logs:"
echo "   journalctl -u nextjs-pm -f" 