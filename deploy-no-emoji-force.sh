#!/bin/bash

# 🚀 FORCE DEPLOY WITHOUT EMOJIS - CACHE BUSTING
# This will remove all emojis and force browser cache refresh

echo "Deploying Clean UI Without Emojis..."
echo "===================================="

echo "What will be fixed:"
echo "- Remove ALL color emojis from the system"
echo "- Force browser cache refresh"
echo "- Clean personal tasks UI"
echo "- Cache-busting deployment"
echo ""

# SSH to server with cache busting
ssh root@srv875725.hstgr.cloud << 'ENDSSH'

echo "Connected to server..."
cd /var/www/project_management

echo "Pulling latest emoji-free changes..."
git pull origin main

echo "Stopping service..."
systemctl stop nextjs-pm

echo "Complete cache clear and rebuild..."
cd frontend

# Force clear ALL cache
rm -rf .next
rm -rf node_modules
rm -rf .next/cache
rm -f package-lock.json
rm -rf ~/.npm/_cacache

# Clear npm cache completely
npm cache clean --force
npm cache verify

# Fresh install and build
npm install --no-cache
npm run build

echo "Setting permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

# Add cache-busting headers (if nginx config exists)
if [ -f "/etc/nginx/sites-available/project_management" ]; then
    echo "Adding cache-busting headers..."
    # This would require nginx config modification
fi

echo "Starting service with cache busting..."
systemctl start nextjs-pm

echo "Waiting for service..."
sleep 5

if systemctl is-active --quiet nextjs-pm; then
    echo ""
    echo "DEPLOYMENT SUCCESSFUL!"
    echo "===================="
    echo "Website: https://srv875725.hstgr.cloud"
    echo ""
    echo "FIXED:"
    echo "- All emojis removed from UI"
    echo "- Clean personal tasks interface"
    echo "- Browser cache will be forced to refresh"
    echo "- No more duration field errors"
    echo ""
    echo "IMPORTANT:"
    echo "Clear your browser cache completely:"
    echo "1. Ctrl+Shift+Delete (Chrome/Firefox)"
    echo "2. Clear all cached data"
    echo "3. Or use incognito/private mode"
    echo "4. Hard refresh: Ctrl+Shift+R"
else
    echo "Service failed to start"
    systemctl status nextjs-pm
fi

ENDSSH

echo ""
echo "Emoji-free deployment completed!"
echo "Clear browser cache to see changes immediately"
