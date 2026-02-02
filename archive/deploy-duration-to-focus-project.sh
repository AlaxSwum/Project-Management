#!/bin/bash

# =============================================
# Deploy Duration Feature to focus-project.co.uk
# =============================================

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
REMOTE_HOST="focus-project.co.uk"
REMOTE_USER="root"
REMOTE_PASSWORD="SpsSps2003@A"
REMOTE_PATH="/var/www/html/frontend"

echo "🚀 Deploying Duration Feature to focus-project.co.uk"
echo "========================================================"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass not found. Installing...${NC}"
    brew install hudochenkov/sshpass/sshpass
fi

echo -e "${BLUE}Step 1: Testing connection...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'Connected!'" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Connection failed!${NC}"
    echo "Please check your internet connection and credentials."
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

echo -e "${BLUE}Step 2: Uploading updated files...${NC}"

# Upload the updated page files
echo "  📤 Uploading personal/page.tsx..."
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    /Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/personal/page.tsx \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/src/app/personal/page.tsx"

echo "  📤 Uploading my-personal/page.tsx..."
sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
    /Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/my-personal/page.tsx \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/src/app/my-personal/page.tsx"

echo -e "${GREEN}✅ Files uploaded${NC}"
echo ""

echo -e "${BLUE}Step 3: Rebuilding application on server...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
cd /var/www/html/frontend

echo "🏗️  Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart all

echo "✅ Rebuild complete!"
ENDSSH

echo -e "${GREEN}✅ Application rebuilt and restarted${NC}"
echo ""

echo "========================================================"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo "========================================================"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update Supabase Database${NC}"
echo ""
echo "Before testing, run this SQL in Supabase SQL Editor:"
echo "------------------------------------------------------"
cat << 'EOSQL'

-- Add duration fields to personal_tasks
ALTER TABLE personal_tasks 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER CHECK (estimated_duration IS NULL OR estimated_duration > 0);

ALTER TABLE personal_tasks 
ADD COLUMN IF NOT EXISTS actual_duration INTEGER CHECK (actual_duration IS NULL OR actual_duration > 0);

-- Add duration field to personal_time_blocks
ALTER TABLE personal_time_blocks 
ADD COLUMN IF NOT EXISTS duration INTEGER CHECK (duration IS NULL OR duration > 0);

-- Add helpful comments
COMMENT ON COLUMN personal_tasks.estimated_duration IS 'Estimated time to complete the task in minutes';
COMMENT ON COLUMN personal_tasks.actual_duration IS 'Actual time spent on the task in minutes';
COMMENT ON COLUMN personal_time_blocks.duration IS 'Duration of the time block in minutes';

EOSQL
echo "------------------------------------------------------"
echo ""
echo "📋 Next Steps:"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Open SQL Editor"
echo "3. Copy the SQL above and click RUN"
echo "4. Test at: https://focus-project.co.uk/my-personal"
echo ""
echo -e "${GREEN}✨ Duration feature is now live!${NC}"
echo ""

