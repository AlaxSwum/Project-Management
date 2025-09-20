#!/bin/bash

# Deploy from Git to Hostinger
echo "🚀 Deploying from Git Repository..."
echo "================================"

# Configuration
REMOTE_HOST="srv875725.hstgr.cloud"
REMOTE_USER="root"
REMOTE_PASSWORD="SpsSps2003@A"
REMOTE_PATH="/var/www/html"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📡 Deploying from Git repository...${NC}"

# Deploy via SSH - pull from git and restart
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
cd /var/www/html

echo "🔄 Pulling latest changes from Git..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "🏗️ Building application..."
npm run build

echo "🔄 Restarting services..."
pm2 restart all

echo "✅ Deployment complete!"
ENDSSH

echo -e "${GREEN}🎉 Git deployment successful!${NC}"
echo -e "${YELLOW}🌐 Visit: https://srv875725.hstgr.cloud/my-personal${NC}"
