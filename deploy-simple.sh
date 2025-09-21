#!/bin/bash

# 🚀 SIMPLE DEPLOYMENT - ENTER SSH PASSWORD WHEN PROMPTED
# This will deploy the latest changes to fix duration field issues

echo "🚀 Deploying Latest Changes to Fix Duration Field Issues..."
echo "=========================================================="

echo "📋 What will be deployed:"
echo "✅ Fix estimated duration field issues in personal tasks"
echo "✅ Complete expense management system with user suggestions"
echo "✅ Hierarchical daily reports (Project → Date → User)"
echo "✅ Consistent mobile navigation"
echo "✅ Responsive design improvements"
echo ""

echo "🔑 You will be prompted for your SSH password..."
echo "💡 Enter your root password for srv875725.hstgr.cloud when prompted"
echo ""

# Direct SSH connection - you'll enter password manually
ssh root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to Hostinger server!"
cd /var/www/project_management

echo "🗑️  Resolving git conflicts..."
git reset --hard HEAD
git clean -fd

echo "📥 Pulling latest changes..."
git pull origin main

echo "⏹️  Stopping Next.js service..."
systemctl stop nextjs-pm

echo "🧹 Clearing cache and rebuilding..."
cd frontend
rm -rf .next node_modules/.cache node_modules package-lock.json
npm cache clean --force
npm install
npm run build

echo "🔧 Setting permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

echo "▶️  Starting services..."
systemctl start nextjs-pm

echo "⏱️  Checking service status..."
sleep 3

if systemctl is-active --quiet nextjs-pm; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo "🌐 https://srv875725.hstgr.cloud"
    echo ""
    echo "🔧 FIXED:"
    echo "✅ Duration field issues resolved"
    echo "✅ Personal tasks working properly"
    echo ""
    echo "🎯 DEPLOYED:"
    echo "✅ Expense Management System"
    echo "✅ User autocomplete suggestions"
    echo "✅ Monthly expense sheets"
    echo "✅ Hierarchical Daily Reports"
    echo ""
    echo "📋 NEXT: Deploy expense database in Supabase"
else
    echo "❌ Service failed to start"
    systemctl status nextjs-pm
fi

ENDSSH

echo ""
echo "🎯 Deployment completed from Cursor terminal!"
echo "🔄 Clear browser cache to see changes"
