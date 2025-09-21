#!/bin/bash

# 🚀 DEPLOY CLEAN PERSONAL TASKS TEMPLATE
# This deploys the clean personal tasks UI without emojis or duration fields

echo "🚀 Deploying Clean Personal Tasks Template..."
echo "============================================"

echo "📋 What will be deployed:"
echo "✅ Clean personal tasks UI (no emojis)"
echo "✅ Removed estimated duration fields"
echo "✅ Simple, stable interface"
echo "✅ Fixed all duration-related errors"
echo "✅ Smaller page sizes (25.2 kB each)"
echo ""

# SSH to server and deploy
ssh root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to server..."
cd /var/www/project_management

echo "📥 Pulling clean personal tasks template..."
git pull origin main

echo "⏹️  Stopping service..."
systemctl stop nextjs-pm

echo "🧹 Rebuilding with clean template..."
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run build

echo "🔧 Setting permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
systemctl start nextjs-pm

echo "⏱️  Checking service..."
sleep 3

if systemctl is-active --quiet nextjs-pm; then
    echo ""
    echo "✅ CLEAN TEMPLATE DEPLOYED!"
    echo "=========================="
    echo "🌐 https://srv875725.hstgr.cloud"
    echo ""
    echo "🎯 FIXED:"
    echo "✅ No more duration field errors"
    echo "✅ Clean UI without emojis"
    echo "✅ Simple, stable personal tasks"
    echo "✅ Reduced page sizes"
    echo ""
    echo "🎯 FEATURES:"
    echo "✅ Add/edit/delete tasks"
    echo "✅ Priority levels (High/Medium/Low)"
    echo "✅ Categories and due dates"
    echo "✅ Status tracking (Todo/In Progress/Completed)"
    echo "✅ Responsive design"
else
    echo "❌ Service failed to start"
    systemctl status nextjs-pm
fi

ENDSSH

echo ""
echo "🎯 Clean personal tasks template deployment completed!"
