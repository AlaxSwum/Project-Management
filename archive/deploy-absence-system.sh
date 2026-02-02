#!/bin/bash

# ========================================
# ABSENCE MANAGEMENT SYSTEM DEPLOYMENT
# ========================================

echo "=================================="
echo "Absence Management System Deployment"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Confirm deployment
echo -e "${YELLOW}This script will deploy the Absence Management System.${NC}"
echo ""
echo "Features to be deployed:"
echo "  ✓ Employee Leave Allocations"
echo "  ✓ Important Dates Management"
echo "  ✓ Leave Balance Tracking"
echo "  ✓ Admin Dashboard UI"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

# Step 2: Check if database file exists
echo ""
echo -e "${BLUE}Step 1: Checking database file...${NC}"

if [ ! -f "create_employee_leave_management.sql" ]; then
    echo -e "${RED}Error: create_employee_leave_management.sql not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database file found${NC}"

# Step 3: Display database script
echo ""
echo -e "${BLUE}Step 2: Database Setup${NC}"
echo ""
echo -e "${YELLOW}Please run the following SQL in your Supabase SQL Editor:${NC}"
echo ""
echo "================================================"
cat create_employee_leave_management.sql
echo "================================================"
echo ""
read -p "Have you run the SQL script in Supabase? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Please run the SQL script first, then rerun this deployment.${NC}"
    exit 1
fi

# Step 4: Verify frontend files
echo ""
echo -e "${BLUE}Step 3: Verifying frontend files...${NC}"

if [ -f "frontend/src/app/admin/page.tsx" ]; then
    echo -e "${GREEN}✓ Frontend admin page updated${NC}"
else
    echo -e "${RED}✗ Frontend admin page not found${NC}"
fi

if [ -f "hostinger_deployment_v2/src/app/admin/page.tsx" ]; then
    echo -e "${GREEN}✓ Hostinger admin page updated${NC}"
else
    echo -e "${RED}✗ Hostinger admin page not found${NC}"
fi

# Step 5: Ask which environment to deploy
echo ""
echo -e "${BLUE}Step 4: Choose deployment environment${NC}"
echo ""
echo "1) Development (local)"
echo "2) Production (Hostinger)"
echo "3) Both"
echo "4) Skip frontend deployment"
echo ""
read -p "Select option (1-4): " env_choice

case $env_choice in
    1)
        echo ""
        echo -e "${BLUE}Building frontend for development...${NC}"
        cd frontend
        npm install
        npm run build
        echo ""
        echo -e "${GREEN}✓ Frontend built successfully!${NC}"
        echo ""
        echo "To start development server, run:"
        echo "  cd frontend"
        echo "  npm run dev"
        ;;
    2)
        echo ""
        echo -e "${BLUE}Building frontend for production...${NC}"
        cd hostinger_deployment_v2
        npm install
        npm run build
        echo ""
        echo -e "${GREEN}✓ Production build completed!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Upload the 'dist' or 'out' folder to Hostinger"
        echo "  2. Update environment variables if needed"
        echo "  3. Test the Absence Management tab"
        ;;
    3)
        echo ""
        echo -e "${BLUE}Building both environments...${NC}"
        
        echo "Building development..."
        cd frontend
        npm install
        npm run build
        cd ..
        
        echo ""
        echo "Building production..."
        cd hostinger_deployment_v2
        npm install
        npm run build
        cd ..
        
        echo ""
        echo -e "${GREEN}✓ Both environments built successfully!${NC}"
        ;;
    4)
        echo ""
        echo -e "${YELLOW}Skipping frontend deployment${NC}"
        ;;
    *)
        echo -e "${RED}Invalid option selected${NC}"
        exit 1
        ;;
esac

# Step 6: Display completion message
echo ""
echo "=================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}What was deployed:${NC}"
echo "  ✓ Database tables created"
echo "  ✓ Leave allocation system"
echo "  ✓ Important dates management"
echo "  ✓ Admin dashboard UI updated"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Login to Admin Dashboard"
echo "  2. Click 'Absence Management' tab"
echo "  3. Set employee leave allocations"
echo "  4. Add important dates"
echo ""
echo -e "${BLUE}Default Leave Allocations:${NC}"
echo "  • Annual Leave: 10 days (max 3 days/request)"
echo "  • Sick Leave: 24 days (max 7 days/month)"
echo "  • Casual Leave: 6 days (max 2 days/month)"
echo ""
echo -e "${YELLOW}For detailed documentation, see: DEPLOY_ABSENCE_MANAGEMENT.md${NC}"
echo ""
echo -e "${GREEN}Happy managing leaves! 🎉${NC}"
echo ""



