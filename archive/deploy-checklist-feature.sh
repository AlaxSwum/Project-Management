#!/bin/bash

# =============================================
# Deploy Task Checklist Feature to Hostinger
# =============================================

set -e  # Exit on any error

echo "🚀 Deploying Task Checklist Feature to focus-project.co.uk"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hostinger credentials
HOSTINGER_USER="u704561835"
HOSTINGER_HOST="154.56.55.56"
HOSTINGER_PATH="domains/focus-project.co.uk/public_html"

echo -e "${BLUE}Step 1: Copying updated files to Hostinger...${NC}"
scp hostinger_deployment_v2/src/app/personal/page.tsx \
    ${HOSTINGER_USER}@${HOSTINGER_HOST}:${HOSTINGER_PATH}/src/app/personal/page.tsx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Files copied successfully${NC}"
else
    echo -e "${YELLOW}⚠ File copy failed. Please check your connection.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Rebuilding application on server...${NC}"
ssh ${HOSTINGER_USER}@${HOSTINGER_HOST} << 'ENDSSH'
    cd domains/focus-project.co.uk/public_html
    
    echo "Installing dependencies..."
    npm install
    
    echo "Building application..."
    npm run build
    
    echo "Restarting PM2..."
    pm2 restart focus-project
    
    echo "Checking PM2 status..."
    pm2 list
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Application rebuilt and restarted successfully${NC}"
else
    echo -e "${YELLOW}⚠ Rebuild failed. Please check server logs.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=============================================="
echo "✅ Deployment Complete!"
echo "=============================================="
echo ""
echo "Next Steps:"
echo "1. Run the SQL script in your Supabase dashboard:"
echo "   File: DEPLOY_TASK_CHECKLIST_FEATURE.sql"
echo ""
echo "2. Visit https://focus-project.co.uk/personal"
echo "   to test the new checklist feature"
echo ""
echo "3. Create a new task and add checklist items"
echo ""
echo -e "${NC}"

