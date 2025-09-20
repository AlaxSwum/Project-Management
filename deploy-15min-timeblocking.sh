#!/bin/bash

# Deploy 15-Minute Timeblocking System to Hostinger
# This script deploys the personal calendar with timeblocking functionality

echo "🚀 Deploying 15-Minute Timeblocking System..."
echo "Target: https://srv875725.hstgr.cloud/"
echo "================================"

# Configuration
REMOTE_HOST="srv875725.hstgr.cloud"
REMOTE_USER="root"
REMOTE_PATH="/var/www/html"
LOCAL_FRONTEND="./frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Preparing deployment package...${NC}"

# Create temporary deployment directory
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Copy frontend files
echo -e "${YELLOW}📁 Copying frontend files...${NC}"
cp -r "$LOCAL_FRONTEND"/* "$TEMP_DIR/"

# List key files being deployed
echo -e "${BLUE}📋 Key files for 15-minute timeblocking:${NC}"
echo "✅ Personal Calendar Page: src/app/my-personal/page.tsx"
echo "✅ Personal Calendar Service: src/lib/personal-calendar-service.ts"
echo "✅ Task Management Components"
echo "✅ 15-minute timeblocking UI"
echo "✅ Drag & Drop functionality"

# Deployment using rsync for efficiency
echo -e "${BLUE}🚀 Deploying to Hostinger...${NC}"
echo "Target: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# Deploy files
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '*.log' \
    "$TEMP_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployment successful!${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed!${NC}"
    exit 1
fi

# Install dependencies and build on remote server
echo -e "${BLUE}📦 Installing dependencies on server...${NC}"
ssh "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
cd /var/www/html
echo "Installing Node.js dependencies..."
npm install --production

echo "Building Next.js application..."
npm run build

echo "Restarting PM2 processes..."
pm2 restart all || pm2 start npm --name "pm-system" -- start

echo "✅ Server-side setup complete!"
ENDSSH

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 15-Minute Timeblocking System Deployed Successfully!${NC}"
echo ""
echo -e "${BLUE}🌐 Your system is now available at:${NC}"
echo -e "${YELLOW}https://srv875725.hstgr.cloud/my-personal${NC}"
echo ""
echo -e "${BLUE}✨ New Features Available:${NC}"
echo "• 15-minute timeblocking view"
echo "• Drag & drop task scheduling"
echo "• Auto-scheduling for tasks with duration"
echo "• Unscheduled tasks sidebar"
echo "• Personal calendar integration"
echo ""
echo -e "${GREEN}🎯 Ready to use! Navigate to My Personal > 15 Min view${NC}"
