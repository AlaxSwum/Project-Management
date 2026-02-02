#!/bin/bash

# 🚀 DEPLOY TO HOSTINGER NOW
# This script will help you deploy the Company Outreach feature

echo "🚀 Deploying Company Outreach to Hostinger..."
echo "================================================"

# Check if we're running on the server
if [[ $(hostname) == *"hstgr"* ]] || [[ -d "/var/www/project_management" ]]; then
    echo "✅ Running on Hostinger server - proceeding with deployment..."
    
    # Navigate to project directory
    cd /var/www/project_management
    
    # Stop services
    echo "🔄 Stopping services..."
    systemctl stop nextjs-pm || echo "Service not running"
    
    # Pull latest code
    echo "📥 Pulling latest code..."
    git pull origin main
    
    # Clear cache and rebuild
    echo "🏗️ Building application..."
    cd frontend
    rm -rf .next node_modules package-lock.json
    npm install
    npm run build
    
    # Set permissions
    echo "🔐 Setting permissions..."
    cd ..
    chown -R www-data:www-data /var/www/project_management
    chmod -R 755 /var/www/project_management
    
    # Start service
    echo "🚀 Starting service..."
    systemctl start nextjs-pm
    
    # Check status
    sleep 3
    if systemctl is-active --quiet nextjs-pm; then
        echo "✅ Deployment successful!"
        echo "🌐 Your app is running at: https://srv875725.hstgr.cloud"
        echo ""
        echo "🗄️ Next: Run the SQL script in Supabase to enable Company Outreach"
        echo "    Copy from: setup_admin_access_simple.sql"
    else
        echo "❌ Service failed to start"
        echo "Check logs: journalctl -u nextjs-pm -f"
    fi
    
else
    echo "🖥️ Not on Hostinger server. Run these commands on your server:"
    echo ""
    echo "ssh root@srv875725.hstgr.cloud"
    echo "cd /var/www/project_management"
    echo "git pull origin main"
    echo "wget https://raw.githubusercontent.com/AlaxSwum/Project-Management/main/deploy-hostinger-now.sh"
    echo "chmod +x deploy-hostinger-now.sh"
    echo "sudo ./deploy-hostinger-now.sh"
fi 