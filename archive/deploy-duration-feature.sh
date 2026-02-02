#!/bin/bash

# =============================================
# Deploy Duration Feature to Hostinger
# =============================================

echo "🚀 Starting deployment of Duration Feature..."
echo ""

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2"

echo -e "${YELLOW}Step 1: Checking files...${NC}"
if [ ! -f "$PROJECT_DIR/src/app/personal/page.tsx" ]; then
    echo -e "${RED}❌ Error: personal/page.tsx not found${NC}"
    exit 1
fi

if [ ! -f "$PROJECT_DIR/src/app/my-personal/page.tsx" ]; then
    echo -e "${RED}❌ Error: my-personal/page.tsx not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All files found${NC}"
echo ""

echo -e "${YELLOW}Step 2: Creating deployment package...${NC}"
cd "$PROJECT_DIR"
tar -czf /tmp/duration-feature.tar.gz \
    src/app/personal/page.tsx \
    src/app/my-personal/page.tsx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Package created: /tmp/duration-feature.tar.gz${NC}"
else
    echo -e "${RED}❌ Failed to create package${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Ready to upload to Hostinger${NC}"
echo ""
echo "==================================================="
echo "📦 Deployment package ready!"
echo "==================================================="
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  First, update your Supabase database:"
echo "   - Go to: https://supabase.com/dashboard"
echo "   - Open SQL Editor"
echo "   - Run the script: QUICK_ADD_DURATION.sql"
echo ""
echo "2️⃣  Then upload to Hostinger:"
echo "   scp /tmp/duration-feature.tar.gz YOUR_USER@YOUR_DOMAIN:/home/YOUR_USER/"
echo ""
echo "3️⃣  SSH into Hostinger and run:"
echo "   ssh YOUR_USER@YOUR_DOMAIN"
echo "   cd public_html"
echo "   tar -xzf ~/duration-feature.tar.gz"
echo "   npm run build"
echo "   pm2 restart all"
echo ""
echo "==================================================="
echo ""
echo -e "${GREEN}✨ Package is ready at: /tmp/duration-feature.tar.gz${NC}"
echo ""

# Ask if user wants to see the SQL script
read -p "Would you like to see the SQL script to run in Supabase? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "==================================================="
    echo "📝 Copy this SQL and run in Supabase SQL Editor:"
    echo "==================================================="
    cat /Users/swumpyaesone/Documents/project_management/QUICK_ADD_DURATION.sql
    echo ""
    echo "==================================================="
fi

echo ""
echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo ""
echo "📖 For detailed instructions, see: DEPLOY_DURATION_FEATURE.md"

