#!/bin/bash

# 🔧 Fix Persistent 502 Bad Gateway Error Script
# This script performs a complete rebuild and service restart

set -e

echo "🔧 Fixing Persistent 502 Bad Gateway Error..."
echo "📅 Time: $(date)"

# Server details
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_USER="root"

echo "🔌 Connecting to $SERVER_HOST..."

# SSH into server and run comprehensive fix
ssh -t $SERVER_USER@$SERVER_HOST << 'ENDSSH'
echo "📍 Connected to Hostinger server"
echo "📅 Server time: $(date)"

echo ""
echo "🛑 Stopping service completely..."
systemctl stop nextjs-pm

echo ""
echo "🧹 Cleaning up old build files..."
cd /var/www/project_management/frontend

# Remove old build files
if [ -d ".next" ]; then
    echo "🗑️ Removing old .next directory..."
    rm -rf .next
fi

# Remove node_modules and reinstall to ensure clean state
echo "🗑️ Removing node_modules..."
rm -rf node_modules

echo ""
echo "📦 Fresh npm install..."
npm cache clean --force
npm install

echo ""
echo "🔨 Building application from scratch..."
NODE_ENV=production npm run build

echo ""
echo "✅ Checking build output..."
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Build successful - BUILD_ID exists"
    cat .next/BUILD_ID
else
    echo "❌ Build failed - BUILD_ID missing"
    echo "📋 Build directory contents:"
    ls -la .next/ || echo "No .next directory"
    exit 1
fi

echo ""
echo "🔄 Starting service with clean build..."
systemctl start nextjs-pm

echo "⏳ Waiting 10 seconds for service to fully start..."
sleep 10

echo ""
echo "🔍 Checking service status..."
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ Next.js service is running!"
    
    echo ""
    echo "📊 Service details:"
    systemctl status nextjs-pm --no-pager -l
    
    echo ""
    echo "🔗 Checking if port 3000 is responding..."
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Port 3000 is responding"
    else
        echo "⚠️ Port 3000 not responding yet - checking logs..."
        journalctl -u nextjs-pm --no-pager -n 10
    fi
else
    echo "❌ Service failed to start - checking logs..."
    journalctl -u nextjs-pm --no-pager -n 20
    
    echo ""
    echo "🔧 Attempting manual start for debugging..."
    cd /var/www/project_management/frontend
    echo "Running: npm start"
    timeout 30s npm start || echo "Manual start timeout/failed"
fi

echo ""
echo "🌐 Checking Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    systemctl reload nginx
else
    echo "❌ Nginx config has issues"
fi

echo ""
echo "🎯 Final comprehensive check:"
echo "Next.js service: $(systemctl is-active nextjs-pm)"
echo "Nginx service: $(systemctl is-active nginx)"
echo "Port 3000 status:"
netstat -tlnp | grep :3000 || echo "Nothing on port 3000"

echo ""
echo "📋 Recent logs (last 5 lines):"
journalctl -u nextjs-pm --no-pager -n 5

echo ""
echo "🌐 Test URLs:"
echo "- https://srv875725.hstgr.cloud"
echo "- http://srv875725.hstgr.cloud:3000"
echo ""

ENDSSH

echo ""
echo "✅ Comprehensive fix completed!"
echo ""
echo "🧪 Please test your site now:"
echo "https://srv875725.hstgr.cloud"
echo ""
echo "If still not working, try:"
echo "http://srv875725.hstgr.cloud:3000"
echo "" 