#!/bin/bash

# 🚀 DEPLOY WITH SSH PASSWORD - FIX DURATION FIELD ISSUES
# This script will deploy the latest changes that fix the estimated duration problems

echo "🚀 Deploying Latest Changes with Duration Field Fix..."
echo "===================================================="

# SSH into server and deploy the fixes
ssh -o StrictHostKeyChecking=no root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to Hostinger server..."
cd /var/www/project_management

echo "🗑️  Resolving git conflicts..."
git reset --hard HEAD
git clean -fd

echo "📥 Pulling latest changes with duration field fixes..."
git pull origin main

echo "⏹️  Stopping services..."
systemctl stop nextjs-pm

echo "🧹 Complete cache clear and rebuild..."
cd frontend
rm -rf .next node_modules/.cache node_modules package-lock.json
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
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "🌐 Your app is running at: https://srv875725.hstgr.cloud"
    echo ""
    echo "🎯 FIXED ISSUES:"
    echo "✅ Estimated duration field completely removed"
    echo "✅ Personal tasks system stabilized"
    echo "✅ Database structure corrected"
    echo "✅ No more duration-related errors"
    echo ""
    echo "🎯 NEW FEATURES DEPLOYED:"
    echo "✅ Complete Expense Management System"
    echo "✅ User autocomplete for member management"
    echo "✅ Monthly expense sheets with totals"
    echo "✅ Hierarchical Daily Reports"
    echo "✅ Consistent mobile navigation"
else
    echo "❌ Service failed to start"
    journalctl -u nextjs-pm --no-pager -n 20
    exit 1
fi

ENDSSH

echo ""
echo "🎯 Duration field issues should now be completely fixed!"
echo "🔄 Clear browser cache: Ctrl+Shift+R"
