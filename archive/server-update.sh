#!/bin/bash

# 🔄 Server Update Script - Run this on Hostinger server
# This script pulls latest changes and updates the running application

set -e

echo "🔄 Updating Project Management System..."
echo "📅 Time: $(date)"

# Navigate to project directory
cd /var/www/project_management

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Navigate to frontend
cd frontend

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install

# Build the updated application
echo "🔨 Building application..."
npm run build

# Restart the service
echo "🔄 Restarting Next.js service..."
sudo systemctl restart nextjs-pm

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
echo "🎉 Update completed successfully!"
echo "🌐 Application is running at: http://srv875725.hstgr.cloud"
echo ""
echo "Changes deployed:"
echo "- Fixed timetable project visibility issue"
echo "- Projects now appear in dropdown even without tasks"
echo "" 