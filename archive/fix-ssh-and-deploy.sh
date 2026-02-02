#!/bin/bash

# 🔧 FIX SSH ISSUE AND DEPLOY CLEAN TEMPLATE
# This script will try multiple SSH methods to fix connection issues

echo "🔧 Fixing SSH Issue and Deploying Clean Template..."
echo "=================================================="

# Check SSH key permissions
echo "📋 Checking SSH key permissions..."
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 700 ~/.ssh

echo "🔑 Your SSH public key:"
cat ~/.ssh/id_ed25519.pub
echo ""

# Method 1: Try with explicit key
echo "🔧 Method 1: Trying with explicit SSH key..."
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 root@srv875725.hstgr.cloud << 'ENDSSH'
echo "✅ Connected with SSH key!"
cd /var/www/project_management
git pull origin main
systemctl stop nextjs-pm
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run build
cd ..
chown -R www-data:www-data /var/www/project_management
systemctl start nextjs-pm
echo "✅ Deployment completed with SSH key!"
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ SSH key deployment successful!"
    exit 0
fi

# Method 2: Try password authentication
echo "🔧 Method 2: Trying password authentication..."
ssh -o PreferredAuthentications=password -o ConnectTimeout=10 root@srv875725.hstgr.cloud << 'ENDSSH'
echo "✅ Connected with password!"
cd /var/www/project_management
git pull origin main
systemctl stop nextjs-pm
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run build
cd ..
chown -R www-data:www-data /var/www/project_management
systemctl start nextjs-pm
echo "✅ Deployment completed with password!"
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Password deployment successful!"
    exit 0
fi

# Method 3: Try with IP address
echo "🔧 Method 3: Trying with IP address..."
ssh -o ConnectTimeout=10 root@168.231.116.32 << 'ENDSSH'
echo "✅ Connected with IP!"
cd /var/www/project_management
git pull origin main
systemctl stop nextjs-pm
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run build
cd ..
chown -R www-data:www-data /var/www/project_management
systemctl start nextjs-pm
echo "✅ Deployment completed with IP!"
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ IP deployment successful!"
    exit 0
fi

echo ""
echo "❌ All SSH methods failed. Here are manual solutions:"
echo ""
echo "🔧 SOLUTION 1: Add SSH Key to Server"
echo "1. Copy this public key:"
cat ~/.ssh/id_ed25519.pub
echo ""
echo "2. Add it to your server's ~/.ssh/authorized_keys file"
echo ""
echo "🔧 SOLUTION 2: Manual Deployment"
echo "Run these commands on your server terminal:"
echo ""
echo "cd /var/www/project_management"
echo "git pull origin main"
echo "systemctl stop nextjs-pm"
echo "cd frontend"
echo "rm -rf .next node_modules/.cache"
echo "npm install"
echo "npm run build"
echo "cd .."
echo "chown -R www-data:www-data /var/www/project_management"
echo "systemctl start nextjs-pm"
echo ""
echo "🔧 SOLUTION 3: Check Server SSH Settings"
echo "Ensure PasswordAuthentication yes in /etc/ssh/sshd_config"
