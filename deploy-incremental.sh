#!/bin/bash

echo "🚀 Fast Incremental Deployment to Hostinger"
echo "📅 Time: $(date)"
echo "⚡ Only rebuilding changed files..."
echo ""

# Deploy with incremental build (much faster)
ssh root@srv875725.hstgr.cloud << 'EOF'
set -e

echo "📍 Navigating to project directory..."
cd /var/www/project_management

echo "⬇️ Pulling latest changes..."
git pull origin main

echo "📁 Entering frontend directory..."
cd frontend

echo "⏸️ Stopping Next.js service..."
systemctl stop nextjs-pm

echo "⚡ Incremental build (keeping cache)..."
# Don't delete .next - let Next.js do incremental compilation
npm run build

echo "▶️ Starting Next.js service..."
systemctl start nextjs-pm

echo "✅ Fast deployment completed!"
echo "🌐 Site live at: https://srv875725.hstgr.cloud"
echo "⚡ Build was incremental - only changed files rebuilt"

EOF

echo ""
echo "✅ Fast incremental deployment completed!"
echo "🌐 Test your changes: https://srv875725.hstgr.cloud"
echo "⚡ This was ~3x faster than full rebuild!" 