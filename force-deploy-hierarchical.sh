#!/bin/bash

# 🚀 FORCE DEPLOY HIERARCHICAL DAILY REPORTS TO HOSTINGER
# This script will force update the server with the latest hierarchical view

echo "🚀 Force Deploying Hierarchical Daily Reports System..."
echo "====================================================="

# SSH into server and force deployment
ssh -o StrictHostKeyChecking=no root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to Hostinger server..."
cd /var/www/project_management

echo "⏹️  Stopping services..."
systemctl stop nextjs-pm || echo "Service not running"

echo "🗑️  Removing conflicting files..."
git reset --hard HEAD
git clean -fd

echo "📥 Force pulling latest hierarchical code..."
git fetch origin main
git reset --hard origin/main

echo "🧹 Complete cache clear and rebuild..."
cd frontend
rm -rf .next node_modules package-lock.json
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
    echo "✅ FORCE DEPLOYMENT SUCCESSFUL!"
    echo "🌐 Your app is running at: https://srv875725.hstgr.cloud"
    echo ""
    echo "🎯 HIERARCHICAL VIEW NOW DEPLOYED:"
    echo "📁 Project Name"
    echo "  📅 Date"
    echo "    👤 User Name"
    echo ""
    echo "✅ Features:"
    echo "- Expandable project folders"
    echo "- Date grouping under projects" 
    echo "- User reports under dates"
    echo "- Meeting minutes indicators"
    echo "- Clean hierarchical structure"
else
    echo "❌ Service failed to start"
    journalctl -u nextjs-pm --no-pager -n 20
    exit 1
fi

ENDSSH

echo ""
echo "🎯 The hierarchical view should now be live!"
echo "🔄 Clear browser cache: Ctrl+Shift+R"
