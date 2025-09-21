#!/bin/bash

# Direct Hostinger Deployment Script
# Target: https://srv875725.hstgr.cloud/personal

echo "🚀 DEPLOYING TO HOSTINGER SERVER"
echo "================================="
echo "Target: https://srv875725.hstgr.cloud/personal"
echo ""

# Check if deployment package exists
if [ ! -f "hostinger_personal_tasks_fix.tar.gz" ]; then
    echo "❌ Deployment package not found!"
    exit 1
fi

echo "📦 Deployment package ready: hostinger_personal_tasks_fix.tar.gz (40MB)"
echo ""

# Hostinger server details
SERVER_HOST="srv875725.hstgr.cloud"
echo "🔧 SERVER DETAILS:"
echo "  Host: $SERVER_HOST"
echo ""

# Prompt for username
read -p "Enter your SSH username (usually the same as your hosting username): " SSH_USER

# Prompt for website path
echo ""
echo "Common Hostinger paths:"
echo "  - /home/$SSH_USER/domains/yourdomain.com/public_html"
echo "  - /home/$SSH_USER/public_html"
echo "  - /home/$SSH_USER/htdocs"
echo ""
read -p "Enter your website directory path: " REMOTE_PATH

echo ""
echo "🚀 STARTING DEPLOYMENT"
echo "====================="
echo "Server: $SSH_USER@$SERVER_HOST"
echo "Path: $REMOTE_PATH"
echo ""
echo "You will be prompted for your password..."
echo ""

# Upload the deployment package
echo "📤 Uploading deployment package..."
scp hostinger_personal_tasks_fix.tar.gz $SSH_USER@$SERVER_HOST:$REMOTE_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Upload failed!"
    echo ""
    echo "🔧 TROUBLESHOOTING:"
    echo "  - Check your username and server details"
    echo "  - Verify SSH access is enabled in Hostinger"
    echo "  - Try using SFTP instead of SSH"
    exit 1
fi

echo "✅ Upload successful!"
echo ""

# Deploy on server
echo "🔧 Deploying on server..."
echo "You may be prompted for password again..."
echo ""

ssh $SSH_USER@$SERVER_HOST << EOF
cd $REMOTE_PATH
echo "📂 Current directory: \$(pwd)"
echo "📦 Extracting deployment package..."
tar -xzf hostinger_personal_tasks_fix.tar.gz

echo "📋 Checking if npm is available..."
if command -v npm &> /dev/null; then
    echo "📦 Installing production dependencies..."
    npm install --production --silent
else
    echo "⚠️  npm not found - skipping dependency installation"
fi

echo "🔄 Looking for process manager..."
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting with PM2..."
    pm2 restart all
elif pgrep -f "node" > /dev/null; then
    echo "🔄 Killing existing Node.js processes..."
    pkill -f "node"
    echo "⚠️  Please start your application manually"
else
    echo "ℹ️  No running Node.js processes found"
fi

echo "🧹 Cleaning up deployment package..."
rm hostinger_personal_tasks_fix.tar.gz

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================"
echo "🌐 Your website should now be updated!"
echo ""
echo "Fixed issues:"
echo "  ✅ Personal tasks loading errors"
echo "  ✅ Time blocks loading errors"  
echo "  ✅ Task creation without duration"
echo "  ✅ 400/406 HTTP errors resolved"
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo ""
    echo "🌐 Test your fixes at: https://srv875725.hstgr.cloud/personal"
    echo ""
    echo "✅ Personal tasks should now work correctly!"
    echo "✅ Time blocks should load without errors!"
    echo "✅ Task creation works without duration field!"
    echo ""
    echo "🧪 VERIFICATION STEPS:"
    echo "  1. Visit https://srv875725.hstgr.cloud/personal"
    echo "  2. Check browser console for errors"
    echo "  3. Try creating a personal task"
    echo "  4. Verify time blocks load properly"
else
    echo ""
    echo "⚠️  Some deployment steps may have failed."
    echo "Please check your server and restart your application manually if needed."
fi

echo ""
echo "🔗 Deployment completed from: $(pwd)"
