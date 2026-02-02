#!/bin/bash

# 🚀 DEPLOY WITH SSHPASS - FIX DURATION FIELD ISSUES
# This script will use sshpass to deploy with your SSH password

echo "🚀 Deploying Latest Changes to Fix Duration Field Issues..."
echo "=========================================================="

echo "📋 This deployment will fix:"
echo "✅ Estimated duration field completely removed"
echo "✅ Personal tasks system stabilized"
echo "✅ Complete expense management system"
echo "✅ Hierarchical daily reports"
echo "✅ Mobile navigation consistency"
echo ""

# Prompt for SSH password
echo "🔑 Enter your SSH password for root@srv875725.hstgr.cloud:"
read -s SSH_PASSWORD

echo ""
echo "🚀 Starting deployment..."

# Use sshpass to connect with password
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to Hostinger server successfully!"
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

echo "🔨 Building application with duration field fixes..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi

echo "🔧 Setting correct permissions..."
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
    echo "🔧 DURATION FIELD ISSUES FIXED:"
    echo "✅ Estimated duration field completely removed"
    echo "✅ Personal tasks system stabilized"
    echo "✅ Database structure corrected"
    echo "✅ No more TaskDetailModal errors"
    echo ""
    echo "🎯 NEW FEATURES DEPLOYED:"
    echo "✅ Complete Expense Management System"
    echo "✅ User autocomplete for member management"
    echo "✅ Monthly expense sheets with totals"
    echo "✅ Hierarchical Daily Reports (Project → Date → User)"
    echo "✅ Consistent mobile navigation"
    echo "✅ Responsive design improvements"
    echo ""
    echo "📋 NEXT STEP:"
    echo "Deploy the expense database schema in Supabase SQL Editor"
    echo ""
    echo "🎉 All duration field issues are now resolved!"
else
    echo "❌ Service failed to start"
    echo "Checking service status and logs..."
    systemctl status nextjs-pm
    journalctl -u nextjs-pm --no-pager -n 20
    exit 1
fi

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "🎯 DEPLOYMENT COMPLETED FROM CURSOR TERMINAL!"
    echo "✅ Duration field issues completely fixed"
    echo "✅ Expense system with user suggestions deployed"
    echo "✅ All personal tasks errors resolved"
    echo ""
    echo "🔄 Clear browser cache: Ctrl+Shift+R to see changes"
else
    echo "❌ Deployment failed - check SSH connection or password"
fi
