#!/bin/bash

echo "🚀 Force Git Deployment to Hostinger (Handles Conflicts)"
echo "📅 Time: $(date)"
echo ""

# Deploy via git pull with conflict resolution
ssh root@srv875725.hstgr.cloud << 'EOF'
set -e

echo "📍 Navigating to project directory..."
cd /var/www/project_management

echo "🔄 Fetching latest changes from GitHub..."
git fetch origin main

echo "⚠️  Resetting to remote main (discarding local changes)..."
git reset --hard origin/main

echo "🧹 Cleaning any untracked files..."
git clean -fd

echo "📁 Navigating to frontend..."
cd frontend

echo "🛑 Stopping Next.js service..."
systemctl stop nextjs-pm

echo "🧹 Cleaning build cache and node_modules..."
rm -rf .next node_modules

echo "📦 Fresh npm install..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Starting Next.js service..."
systemctl start nextjs-pm

echo "🎉 Deployment completed!"
echo "🌐 Site should be live at: https://srv875725.hstgr.cloud"

EOF

echo ""
echo "✅ Force deployment completed!"
echo "🌐 Test your site: https://srv875725.hstgr.cloud/timetable" 