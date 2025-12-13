#!/bin/bash

# 🚀 Deploy Payroll Page Styling Fix to Hostinger
# This script deploys the fixed payroll page with proper styling

echo "🚀 Deploying Payroll Styling Fix to Hostinger..."
echo "=================================================="

# Server details
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_USER="root"
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

# Clean build directory
echo "🧹 Cleaning build directory..."
rm -rf .next

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install

# Build the updated application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Restart the service
echo "🔄 Restarting Next.js service..."
systemctl restart nextjs-pm

# Check service status
echo "✅ Checking service status..."
sleep 3
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ Next.js service is running successfully!"
else
    echo "❌ Next.js service failed to start"
    echo "📋 Service logs:"
    journalctl -u nextjs-pm --no-pager -n 20
    exit 1
fi

echo ""
echo "🎉 Payroll styling fix deployed successfully!"
echo "🌐 Application is running at: https://srv875725.hstgr.cloud"
echo ""
echo "✨ Changes deployed:"
echo "- Fixed payroll page styling"
echo "- Added proper hover and focus states for inputs"
echo "- Enhanced button interactions"
echo "- Improved overall visual appearance"
echo ""
ENDSSH

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your payroll page should now have proper styling at: https://srv875725.hstgr.cloud/payroll"
echo ""
