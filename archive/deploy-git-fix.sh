#!/bin/bash

echo "🚀 Fast Git-based Deployment to Hostinger"
echo "📅 Time: $(date)"
echo ""

# Deploy via git pull
ssh root@srv875725.hstgr.cloud << 'EOF'
set -e

echo "📍 Navigating to project directory..."
cd /var/www/project_management

echo "🔄 Pulling latest changes from GitHub..."
git pull origin main

echo "📁 Navigating to frontend..."
cd frontend

echo "🛑 Stopping Next.js service..."
systemctl stop nextjs-pm

echo "🧹 Cleaning build cache..."
rm -rf .next

echo "🔨 Building application..."
npm run build

echo "✅ Starting Next.js service..."
systemctl start nextjs-pm

echo "🎉 Deployment completed!"
echo "🌐 Site should be live at: https://srv875725.hstgr.cloud"

EOF

echo ""
echo "✅ Deployment script completed!"
echo "🌐 Test your site: https://srv875725.hstgr.cloud/timetable" 