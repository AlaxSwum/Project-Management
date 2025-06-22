#!/bin/bash

# 🔧 Run 502 Fix Remotely from Local Machine
# This script executes the fix commands on your server from here

echo "🚨 Running 502 Bad Gateway Fix on Remote Server..."
echo "📅 Time: $(date)"
echo ""

# Server details
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_USER="root"

echo "🔌 Connecting to $SERVER_HOST and running fix..."
echo ""

# Execute commands on remote server
ssh $SERVER_USER@$SERVER_HOST << 'EOF'
echo "📍 Connected to Hostinger server"
echo "📅 Server time: $(date)"
echo ""

echo "🛑 Step 1: Stopping Next.js service..."
systemctl stop nextjs-pm
echo "✅ Service stopped"

echo ""
echo "📁 Step 2: Navigating to frontend directory..."
cd /var/www/project_management/frontend
pwd

echo ""
echo "🧹 Step 3: Cleaning old build files..."
if [ -d ".next" ]; then
    echo "🗑️ Removing .next directory..."
    rm -rf .next
fi

if [ -d "node_modules" ]; then
    echo "🗑️ Removing node_modules..."
    rm -rf node_modules
fi

echo "✅ Cleanup complete"

echo ""
echo "📦 Step 4: Fresh npm install..."
npm cache clean --force
npm install

echo ""
echo "🔨 Step 5: Building application..."
NODE_ENV=production npm run build

echo ""
echo "✅ Step 6: Verifying build..."
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Build successful! BUILD_ID exists:"
    cat .next/BUILD_ID
else
    echo "❌ Build failed - BUILD_ID not found"
    echo "📋 Checking .next directory:"
    ls -la .next/ 2>/dev/null || echo "No .next directory found"
    exit 1
fi

echo ""
echo "🚀 Step 7: Starting Next.js service..."
systemctl start nextjs-pm

echo ""
echo "⏳ Step 8: Waiting 5 seconds for service to start..."
sleep 5

echo ""
echo "🔍 Step 9: Checking service status..."
if systemctl is-active --quiet nextjs-pm; then
    echo "✅ Next.js service is running!"
    
    echo ""
    echo "📊 Service details:"
    systemctl status nextjs-pm --no-pager -l | head -10
    
    echo ""
    echo "🔗 Checking port 3000..."
    if netstat -tlnp | grep :3000 > /dev/null; then
        echo "✅ Port 3000 is active"
        netstat -tlnp | grep :3000
    else
        echo "❌ Port 3000 not found"
    fi
    
else
    echo "❌ Service failed to start!"
    echo ""
    echo "📋 Service logs:"
    journalctl -u nextjs-pm --no-pager -n 10
    exit 1
fi

echo ""
echo "🌐 Step 10: Checking Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "⚠️ Nginx not running - starting..."
    systemctl start nginx
fi

echo ""
echo "🎉 Fix completed successfully!"
echo ""
echo "🧪 Test these URLs:"
echo "- Main site: https://srv875725.hstgr.cloud"
echo "- Direct: http://srv875725.hstgr.cloud:3000"
echo "- Timetable: https://srv875725.hstgr.cloud/timetable"
echo ""
echo "✅ Your team members and meetings fixes should now be working!"
echo ""

EOF

echo ""
echo "✅ Remote fix execution completed!"
echo ""
echo "🌐 Test your site now:"
echo "https://srv875725.hstgr.cloud/timetable"
echo ""
echo "If successful, you should see:"
echo "- ✅ Projects in dropdown"
echo "- ✅ Team members with real names (not '0')"
echo "- ✅ Meetings appearing in calendar/list"
echo "" 