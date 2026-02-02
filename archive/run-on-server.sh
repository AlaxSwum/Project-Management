#!/bin/bash

# 🚀 RUN THIS SCRIPT DIRECTLY ON YOUR HOSTINGER SERVER
# Copy this entire script and run it on srv875725.hstgr.cloud

echo "🚀 Deploying Latest Changes on Hostinger Server..."
echo "=================================================="

# Check if we're on the server
if [ ! -d "/var/www/project_management" ]; then
    echo "❌ Error: This script must be run on the Hostinger server"
    echo "Please SSH into your server first:"
    echo "ssh root@srv875725.hstgr.cloud"
    echo "Then run this script"
    exit 1
fi

# Navigate to project directory
cd /var/www/project_management

echo "📥 Pulling latest changes from Git..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Trying to reset..."
    git reset --hard HEAD
    git clean -fd
    git pull origin main
fi

echo "⏹️  Stopping Next.js service..."
systemctl stop nextjs-pm

echo "🧹 Clearing cache and dependencies..."
cd frontend
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules
rm -f package-lock.json

echo "📦 Installing dependencies..."
npm cache clean --force
npm install

echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi

echo "🔧 Setting correct permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

echo "▶️  Starting Next.js service..."
systemctl start nextjs-pm

echo "⏱️  Waiting for service to start..."
sleep 5

# Check if service is running
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🌐 Your app is running at: https://srv875725.hstgr.cloud"
    echo ""
    echo "🎯 DEPLOYED FEATURES:"
    echo "✅ Complete Expense Management System"
    echo "✅ User autocomplete for member management"
    echo "✅ Monthly expense sheets with totals"
    echo "✅ Hierarchical Daily Reports"
    echo "✅ Fixed Personal Tasks system"
    echo "✅ Consistent mobile navigation"
    echo "✅ Responsive design improvements"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Deploy expense database schema in Supabase SQL Editor"
    echo "2. Clear browser cache: Ctrl+Shift+R"
    echo "3. Test the new Expenses tab in navigation"
    echo ""
    echo "🎉 All systems deployed successfully!"
else
    echo "❌ Service failed to start!"
    echo "Checking service status..."
    systemctl status nextjs-pm
    echo ""
    echo "Recent logs:"
    journalctl -u nextjs-pm --no-pager -n 20
fi
