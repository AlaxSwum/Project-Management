#!/bin/bash

# SSH Deployment Script for Hostinger
# This script can upload directly to your server if you have SSH access

echo "🌐 SSH DEPLOYMENT TO HOSTINGER SERVER"
echo "====================================="

# Check if deployment package exists
if [ ! -f "hostinger_personal_tasks_fix.tar.gz" ]; then
    echo "❌ Deployment package not found. Run ./deploy-direct-to-hostinger.sh first"
    exit 1
fi

echo "📦 Deployment package ready: hostinger_personal_tasks_fix.tar.gz"
echo ""

# Server connection details (you'll need to provide these)
echo "🔧 SERVER CONNECTION SETUP"
echo "=========================="
echo "To deploy directly via SSH, you need:"
echo "1. Your Hostinger server SSH details"
echo "2. SSH key or password access"
echo ""

read -p "Enter your server hostname/IP (e.g., srv875725.hstgr.cloud): " SERVER_HOST
read -p "Enter your SSH username: " SSH_USER
read -p "Enter the path to your website directory on the server: " REMOTE_PATH

echo ""
echo "🚀 DEPLOYING TO SERVER"
echo "====================="
echo "Server: $SSH_USER@$SERVER_HOST"
echo "Path: $REMOTE_PATH"
echo ""

# Upload the deployment package
echo "📤 Uploading deployment package..."
scp hostinger_personal_tasks_fix.tar.gz $SSH_USER@$SERVER_HOST:$REMOTE_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Upload failed! Check your SSH connection and credentials."
    exit 1
fi

echo "✅ Upload successful!"
echo ""

# Connect to server and deploy
echo "🔧 Extracting and deploying on server..."
ssh $SSH_USER@$SERVER_HOST << EOF
cd $REMOTE_PATH
echo "📂 Current directory: \$(pwd)"
echo "📦 Extracting deployment package..."
tar -xzf hostinger_personal_tasks_fix.tar.gz
echo "✅ Files extracted"

echo "📋 Installing dependencies..."
npm install --production

echo "🔄 Restarting application..."
# Try different restart methods
if command -v pm2 &> /dev/null; then
    echo "Using PM2 to restart..."
    pm2 restart all
elif command -v systemctl &> /dev/null; then
    echo "Using systemctl to restart..."
    sudo systemctl restart your-app-name
else
    echo "⚠️  Please manually restart your Node.js application"
fi

echo "🧹 Cleaning up..."
rm hostinger_personal_tasks_fix.tar.gz

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================"
echo "🌐 Test your website: https://srv875725.hstgr.cloud/personal"
echo ""
echo "The following should now work:"
echo "  ✅ Personal tasks loading without errors"
echo "  ✅ Time blocks loading correctly"
echo "  ✅ Task creation without duration field"
echo "  ✅ No more 400/406 HTTP errors"
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo "🔗 Your website is now updated: https://srv875725.hstgr.cloud/personal"
    echo ""
    echo "✅ Personal tasks fix has been deployed!"
    echo "✅ Database was already updated"
    echo "✅ Frontend code is now live"
    echo ""
    echo "🧪 TEST THE FIX:"
    echo "1. Visit https://srv875725.hstgr.cloud/personal"
    echo "2. Try creating a personal task (no duration required)"
    echo "3. Check that time blocks load without errors"
    echo "4. Verify no 400/406 errors in browser console"
else
    echo ""
    echo "⚠️  Deployment completed but some commands may have failed."
    echo "Please check your server manually and restart your application if needed."
fi
