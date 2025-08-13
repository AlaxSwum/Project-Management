#!/bin/bash

# 🚀 Remote Deployment Script for Hostinger
# This script connects to your Hostinger server and deploys the latest changes

set -e

echo "🚀 Starting Remote Deployment to Hostinger..."
echo "📅 Time: $(date)"

# Server details (update these if needed)
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_USER="root"  # or your server username
PROJECT_PATH="/var/www/project_management"

echo "🔌 Connecting to $SERVER_HOST..."

# Support non-interactive password via SSHPASS if provided
if [ -n "$SSHPASS" ]; then
  SSH_BIN="sshpass -e ssh -o StrictHostKeyChecking=no -t"
else
  SSH_BIN="ssh -t"
fi

# SSH into server and run deployment commands
$SSH_BIN $SERVER_USER@$SERVER_HOST << 'ENDSSH'
echo "📍 Connected to Hostinger server"
echo "📅 Server time: $(date)"

# Navigate to project directory
cd /var/www/project_management

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Navigate to frontend
cd frontend

# Clean build directory to fix BUILD_ID issue
echo "🧹 Cleaning build directory..."
rm -rf .next

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install

# Build the updated application
echo "🔨 Building application..."
npm run build

# Restart the service
echo "🔄 Restarting Next.js service..."
systemctl restart nextjs-pm

# Check service status
echo "✅ Checking service status..."
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ Next.js service is running successfully!"
else
    echo "❌ Next.js service failed to start"
    echo "📋 Service logs:"
    journalctl -u nextjs-pm --no-pager -n 10
    exit 1
fi

echo ""
echo "🎉 Remote deployment completed successfully!"
echo "🌐 Application is running at: https://srv875725.hstgr.cloud"
echo ""
echo "Changes deployed:"
echo "- Fixed TypeScript error in reporting page"
echo "- Clean rebuild to fix BUILD_ID issue"
echo ""
ENDSSH

echo ""
echo "✅ Remote deployment completed!"
echo "🌐 Your application should now be updated at: https://srv875725.hstgr.cloud"
echo "" 