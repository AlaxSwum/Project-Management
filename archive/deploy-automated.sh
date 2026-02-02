#!/bin/bash

# Automated deployment script for Hostinger
echo "🚀 Starting automated deployment to Hostinger..."

# Server details
SERVER="srv875725.hstgr.cloud"
USER="root"
PROJECT_PATH="/var/www/project_management"

echo "📡 Connecting to server and deploying..."

# Use expect to handle password automatically
expect << EOF
spawn ssh $USER@$SERVER "cd $PROJECT_PATH && git reset --hard HEAD && git clean -fd && git pull origin main && ./deploy-to-hostinger-now.sh"
expect "password:"
send "SpsSps2003@A\r"
expect eof
EOF

echo "✅ Deployment script completed!"
echo ""
echo "🌐 Your website should be accessible at:"
echo "   https://srv875725.hstgr.cloud"
echo ""
echo "📋 Don't forget to run the SQL script in Supabase:"
echo "   emergency-password-vault-fix.sql"
