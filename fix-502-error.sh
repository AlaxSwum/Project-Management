#!/bin/bash

# 🚨 Fix 502 Bad Gateway Error Script
# This script diagnoses and fixes service issues on Hostinger

set -e

echo "🚨 Fixing 502 Bad Gateway Error on Hostinger..."
echo "📅 Time: $(date)"

# Server details
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_USER="root"

echo "🔌 Connecting to $SERVER_HOST..."

# SSH into server and run diagnostic commands
ssh -t $SERVER_USER@$SERVER_HOST << 'ENDSSH'
echo "📍 Connected to Hostinger server"
echo "📅 Server time: $(date)"

echo ""
echo "🔍 Checking service status..."

# Check if Next.js service is running
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ Next.js service is active"
else
    echo "❌ Next.js service is NOT running"
fi

# Show detailed service status
echo ""
echo "📊 Service status details:"
systemctl status nextjs-pm --no-pager

echo ""
echo "📋 Recent service logs:"
journalctl -u nextjs-pm --no-pager -n 20

echo ""
echo "🔄 Attempting to restart Next.js service..."
systemctl restart nextjs-pm

echo "⏳ Waiting 5 seconds for service to start..."
sleep 5

echo ""
echo "✅ Checking service status after restart:"
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ Next.js service is now running!"
else
    echo "❌ Next.js service failed to start"
    echo ""
    echo "📋 Error logs:"
    journalctl -u nextjs-pm --no-pager -n 10
    
    echo ""
    echo "🔧 Attempting manual start..."
    cd /var/www/project_management/frontend
    
    echo "📦 Checking Node.js and npm..."
    node --version
    npm --version
    
    echo ""
    echo "🔨 Rebuilding application..."
    npm run build
    
    echo ""
    echo "🔄 Restarting service again..."
    systemctl restart nextjs-pm
    sleep 3
    
    if systemctl is-active --quiet nextjs-pm; then
        echo "✅ Service started successfully after rebuild!"
    else
        echo "❌ Service still failing - checking detailed logs:"
        journalctl -u nextjs-pm --no-pager -n 15
    fi
fi

echo ""
echo "🌐 Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running - restarting..."
    systemctl restart nginx
fi

echo ""
echo "🔗 Checking port 3000..."
if netstat -tlnp | grep :3000; then
    echo "✅ Something is listening on port 3000"
else
    echo "❌ Nothing listening on port 3000"
fi

echo ""
echo "🎯 Final status check:"
echo "Next.js: $(systemctl is-active nextjs-pm)"
echo "Nginx: $(systemctl is-active nginx)"

echo ""
echo "🌐 Try accessing your site now: https://srv875725.hstgr.cloud"
echo ""
ENDSSH

echo ""
echo "✅ Troubleshooting completed!"
echo ""
echo "🧪 Test your site:"
echo "- Direct Next.js: http://srv875725.hstgr.cloud:3000"
echo "- Via Nginx: https://srv875725.hstgr.cloud"
echo "" 