#!/bin/bash

# 🔄 Force Update Deployment Script for Hostinger
# This script handles local changes by stashing them and pulling latest code

set -e

echo "🚀 Starting Force Update Deployment to Hostinger..."
echo "📅 Time: $(date)"

# Server details
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_USER="root"

echo "🔌 Connecting to $SERVER_HOST..."

# SSH into server and run deployment commands
ssh -t $SERVER_USER@$SERVER_HOST << 'ENDSSH'
echo "📍 Connected to Hostinger server"
echo "📅 Server time: $(date)"

# Navigate to project directory
cd /var/www/project_management

echo "💾 Stashing any local changes..."
git stash push -m "Auto-stash before deployment $(date)"

echo "📥 Force pulling latest changes from GitHub..."
git fetch origin main
git reset --hard origin/main

echo "✅ Repository updated successfully"

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
echo "🎉 Force deployment completed successfully!"
echo "🌐 Application is running at: https://srv875725.hstgr.cloud"
echo ""
echo "🔧 Fixes deployed:"
echo "- Team members now show actual names instead of '0'"
echo "- Meetings now appear properly in calendar and list view"
echo "- All accessible projects appear in dropdown"
echo ""
ENDSSH

echo ""
echo "✅ Force deployment completed!"
echo "🌐 Your application should now be updated at: https://srv875725.hstgr.cloud"
echo ""
echo "🧪 Test the fixes:"
echo "1. Go to https://srv875725.hstgr.cloud/timetable"
echo "2. Click 'Schedule New Meeting'"
echo "3. Select a project and check team members show names"
echo "4. Create a meeting and verify it appears in the view"
echo "" 