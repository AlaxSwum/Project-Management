#!/bin/bash

# Deploy to focus-project.co.uk
echo "🚀 Deploying to focus-project.co.uk..."
echo "================================"

# Configuration for focus-project.co.uk
REMOTE_HOST="focus-project.co.uk"
REMOTE_USER="root"
REMOTE_PASSWORD="SpsSps2003@A"
REMOTE_PATH="/var/www/html"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔗 Testing connection to focus-project.co.uk...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'Connection successful!'"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Connection failed! Check credentials or domain.${NC}"
    exit 1
fi

echo -e "${BLUE}📡 Deploying from Git repository...${NC}"

# Deploy via SSH - pull from git and restart
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
cd /var/www/html

echo "🔄 Pulling latest changes from Git..."
git pull origin main

echo "📦 Installing dependencies..."
cd frontend
npm install --production

echo "🏗️ Building application..."
npm run build

echo "🔄 Restarting services..."
pm2 restart all || pm2 start npm --name "frontend" -- start

echo "✅ Deployment complete!"
ENDSSH

echo -e "${GREEN}🎉 Deployment to focus-project.co.uk successful!${NC}"
echo -e "${YELLOW}🌐 Visit: https://focus-project.co.uk/content-calendar${NC}"
echo -e "${YELLOW}🌐 Personal Tasks: https://focus-project.co.uk/personal${NC}"
