#!/bin/bash

# Automated Hostinger Deployment Script
echo "🚀 Starting deployment to Hostinger server..."
echo "================================================"

# Server configuration
SERVER="srv875725.hstgr.cloud"
USER="root"
PASSWORD="SpsSps2003@A"
PROJECT_PATH="/var/www/project_management"

# Function to execute commands on remote server
execute_remote() {
    local command="$1"
    echo "📡 Executing: $command"
    
    # Use SSH with password (requires sshpass or manual entry)
    ssh -o StrictHostKeyChecking=no $USER@$SERVER "$command"
}

echo "🔧 Step 1: Resetting server state..."
execute_remote "cd $PROJECT_PATH && git reset --hard HEAD && git clean -fd"

echo "📥 Step 2: Pulling latest code..."
execute_remote "cd $PROJECT_PATH && git pull origin main"

echo "🏗️  Step 3: Running deployment script..."
execute_remote "cd $PROJECT_PATH && chmod +x deploy-to-hostinger-now.sh && ./deploy-to-hostinger-now.sh"

echo "✅ Deployment completed!"
echo ""
echo "🌐 Your website should be accessible at:"
echo "   https://srv875725.hstgr.cloud"
echo "   http://168.231.116.32"
echo ""
echo "📋 Next steps:"
echo "   1. Test the website functionality"
echo "   2. Run SQL script in Supabase if needed: emergency-password-vault-fix.sql"
