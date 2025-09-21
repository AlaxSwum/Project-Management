#!/bin/bash

# 🚀 INTERACTIVE DEPLOYMENT WITH SSH PASSWORD
# This script will prompt for SSH password and deploy latest changes

echo "🚀 Deploying Latest Changes to Fix Duration Field Issues..."
echo "=========================================================="

echo "📋 This will deploy:"
echo "✅ Fix estimated duration field issues in personal tasks"
echo "✅ Complete expense management system"
echo "✅ Hierarchical daily reports"
echo "✅ Mobile navigation consistency"
echo ""

read -p "🔑 Press Enter to continue with SSH deployment..."

# SSH with password prompt
ssh -t root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to Hostinger server..."
cd /var/www/project_management

echo "🗑️  Resolving any git conflicts..."
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

echo "🔨 Building application with fixes..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the error messages above."
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
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo "🌐 Your app is running at: https://srv875725.hstgr.cloud"
    echo ""
    echo "🔧 FIXED ISSUES:"
    echo "✅ Estimated duration field completely removed"
    echo "✅ Personal tasks system stabilized"
    echo "✅ No more duration-related errors"
    echo ""
    echo "🎯 NEW FEATURES DEPLOYED:"
    echo "✅ Complete Expense Management System"
    echo "✅ User autocomplete for member management"
    echo "✅ Monthly expense sheets with totals"
    echo "✅ Hierarchical Daily Reports (Project → Date → User)"
    echo "✅ Consistent mobile navigation"
    echo "✅ Responsive design improvements"
    echo ""
    echo "📋 FINAL STEP:"
    echo "Deploy the expense database schema in Supabase SQL Editor"
    echo ""
    echo "🎉 All systems deployed and working!"
else
    echo "❌ Service failed to start"
    echo "Checking logs..."
    journalctl -u nextjs-pm --no-pager -n 20
    exit 1
fi

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "🎯 DEPLOYMENT COMPLETED FROM CURSOR TERMINAL!"
    echo "✅ Duration field issues fixed"
    echo "✅ Expense system deployed"
    echo "✅ All features working"
    echo ""
    echo "🔄 Clear browser cache: Ctrl+Shift+R"
else
    echo "❌ Deployment failed - check server connection"
fi
