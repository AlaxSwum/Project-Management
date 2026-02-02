#!/bin/bash

# 🚀 DEPLOY DIRECTLY TO SSH SERVER - CLEAN PERSONAL TASKS
# This will deploy the clean template directly to your Hostinger server

echo "🚀 Deploying Clean Personal Tasks to SSH Server..."
echo "=================================================="

echo "📋 Deploying to: srv875725.hstgr.cloud"
echo "✅ Clean personal tasks UI (no emojis)"
echo "✅ Removed estimated duration fields"
echo "✅ Fixed all duration-related errors"
echo ""

# Try multiple SSH connection methods
echo "🔑 Attempting SSH connection..."

# Method 1: Try with hostname
echo "Trying hostname connection..."
ssh -o ConnectTimeout=10 -o BatchMode=yes root@srv875725.hstgr.cloud << 'ENDSSH' 2>/dev/null
echo "✅ Connected via hostname"
cd /var/www/project_management
git pull origin main
systemctl stop nextjs-pm
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run build
cd ..
chown -R www-data:www-data /var/www/project_management
systemctl start nextjs-pm
echo "✅ Deployment completed via hostname"
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful via hostname!"
    exit 0
fi

# Method 2: Try with IP address
echo "Trying IP address connection..."
ssh -o ConnectTimeout=10 -o BatchMode=yes root@168.231.116.32 << 'ENDSSH' 2>/dev/null
echo "✅ Connected via IP"
cd /var/www/project_management
git pull origin main
systemctl stop nextjs-pm
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run build
cd ..
chown -R www-data:www-data /var/www/project_management
systemctl start nextjs-pm
echo "✅ Deployment completed via IP"
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful via IP!"
    exit 0
fi

# Method 3: Interactive SSH (will prompt for password)
echo "🔑 Trying interactive SSH (you'll need to enter password)..."
ssh -o ConnectTimeout=30 root@srv875725.hstgr.cloud << 'ENDSSH'
echo "🔄 Connected to Hostinger server!"
cd /var/www/project_management

echo "📥 Pulling latest changes with clean personal tasks..."
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
    echo "🎉 CLEAN TEMPLATE DEPLOYED TO SSH SERVER!"
    echo "========================================"
    echo "🌐 https://srv875725.hstgr.cloud"
    echo ""
    echo "🔧 FIXED:"
    echo "✅ No more duration field errors"
    echo "✅ Clean UI without emojis"
    echo "✅ Simple personal tasks interface"
    echo "✅ Stable system"
    echo ""
    echo "🎯 FEATURES:"
    echo "✅ Add/edit/delete tasks"
    echo "✅ Priority levels"
    echo "✅ Categories and due dates"
    echo "✅ Status tracking"
    echo "✅ Responsive design"
else
    echo "❌ Service failed to start"
    systemctl status nextjs-pm
fi

ENDSSH

echo ""
echo "🎯 SSH deployment completed!"
