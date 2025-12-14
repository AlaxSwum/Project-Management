#!/bin/bash

# 🚀 Deploy Payroll Page Styling Fix to focus-project.co.uk
# This script deploys the fixed payroll page with proper styling

echo "🚀 Deploying Payroll Styling Fix to focus-project.co.uk..."
echo "=========================================================="

# Server details
SERVER_HOST="focus-project.co.uk"
SERVER_USER="root"
PROJECT_PATH="domains/focus-project.co.uk/public_html"

echo "🔌 Connecting to $SERVER_HOST..."

# Support non-interactive password via SSHPASS if provided
if [ -n "$SSHPASS" ]; then
  SSH_BIN="sshpass -e ssh -o StrictHostKeyChecking=no -t"
else
  SSH_BIN="ssh -t"
fi

# SSH into server and run deployment commands
$SSH_BIN $SERVER_USER@$SERVER_HOST << 'ENDSSH'
echo "📍 Connected to focus-project.co.uk server"
echo "📅 Server time: $(date)"

# Find the correct project path
if [ -d "/home/u704561835/domains/focus-project.co.uk/public_html" ]; then
    PROJECT_DIR="/home/u704561835/domains/focus-project.co.uk/public_html"
elif [ -d "~/domains/focus-project.co.uk/public_html" ]; then
    PROJECT_DIR="~/domains/focus-project.co.uk/public_html"
elif [ -d "/var/www/html" ]; then
    PROJECT_DIR="/var/www/html"
else
    echo "❌ Could not find project directory. Searching..."
    find /home -name "public_html" -type d 2>/dev/null | head -1
    PROJECT_DIR=$(find /home -name "public_html" -type d 2>/dev/null | grep focus-project | head -1)
    if [ -z "$PROJECT_DIR" ]; then
        echo "❌ Project directory not found!"
        exit 1
    fi
fi

echo "📁 Using project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Check if frontend directory exists
if [ -d "frontend" ]; then
    cd frontend
    echo "📁 Found frontend directory"
elif [ -f "package.json" ]; then
    echo "📁 Using root directory"
else
    echo "❌ Could not find frontend directory or package.json"
    exit 1
fi

# Pull latest changes (stash local changes first)
echo "📥 Pulling latest changes from GitHub..."
git stash
git fetch origin
git reset --hard origin/main

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install

# Clean build directory
echo "🧹 Cleaning build directory..."
rm -rf .next

# Build the updated application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Restart the PM2 service
echo "🔄 Restarting PM2 service..."
pm2 restart focus-project

# Check service status
echo "✅ Checking service status..."
sleep 2
pm2 list | grep focus-project

echo ""
echo "🎉 Payroll styling fix deployed successfully!"
echo "🌐 Application is running at: https://focus-project.co.uk"
echo ""
echo "✨ Changes deployed:"
echo "- Fixed payroll page styling"
echo "- Added proper hover and focus states for inputs"
echo "- Enhanced button interactions"
echo "- Improved overall visual appearance"
echo ""
echo "🔗 Test at: https://focus-project.co.uk/payroll"
echo ""
ENDSSH

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your payroll page should now have proper styling at: https://focus-project.co.uk/payroll"
echo ""
echo "💡 If changes don't appear immediately:"
echo "   1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "   2. Try opening in an incognito/private window"
echo "   3. Check PM2 logs: ssh root@focus-project.co.uk 'pm2 logs focus-project --lines 20'"
echo ""

