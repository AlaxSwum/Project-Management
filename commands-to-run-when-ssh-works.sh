#!/bin/bash

# =============================================
# Run these commands when SSH connection works
# =============================================

echo "🚀 Deploying Task Checklist Feature"
echo "===================================="

# SSH into Hostinger and deploy
ssh u704561835@154.56.55.56 << 'ENDSSH'
    # Navigate to project directory
    cd domains/focus-project.co.uk/public_html
    
    echo "📂 Current directory: $(pwd)"
    
    # Pull latest changes (if using git)
    # git pull origin main
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🔨 Building application..."
    npm run build
    
    echo "🔄 Restarting PM2..."
    pm2 restart focus-project
    
    echo "📊 PM2 Status:"
    pm2 list
    
    echo ""
    echo "✅ Deployment complete!"
    echo "Visit: https://focus-project.co.uk/personal"
ENDSSH

echo ""
echo "🎉 All done! Check your website now."

