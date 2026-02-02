#!/bin/bash

# =====================================================
# Email Tracking System Deployment Script
# For Rother Care Pharmacy
# =====================================================

echo "=========================================="
echo "Email Tracking System Deployment"
echo "Rother Care Pharmacy"
echo "=========================================="
echo ""

# Check if we're in the correct directory
if [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Database deployment instructions
echo -e "${BLUE}Step 1: Database Deployment${NC}"
echo "----------------------------------------"
echo "Please complete the following steps in Supabase:"
echo ""
echo "1. Open Supabase SQL Editor"
echo "2. Copy the contents of: create_email_tracking_system.sql"
echo "3. Paste into SQL Editor and click 'Run'"
echo "4. Wait for successful completion"
echo ""
echo -e "${YELLOW}SQL File Location:${NC}"
echo "   $(pwd)/create_email_tracking_system.sql"
echo ""
read -p "Press Enter when database deployment is complete..."

# Step 2: Verify database setup
echo ""
echo -e "${BLUE}Step 2: Verify Database Setup${NC}"
echo "----------------------------------------"
echo "Run this query in Supabase to verify tables:"
echo ""
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public' AND table_name LIKE 'email_%'"
echo "ORDER BY table_name;"
echo ""
echo "You should see 5 tables:"
echo "  - email_accounts"
echo "  - email_tracking_archive"
echo "  - email_tracking_entries"
echo "  - email_tracking_folder_access"
echo "  - email_tracking_folders"
echo ""
read -p "Press Enter when verification is complete..."

# Step 3: Build frontend
echo ""
echo -e "${BLUE}Step 3: Building Frontend${NC}"
echo "----------------------------------------"
cd frontend

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: npm install failed${NC}"
    exit 1
fi

# Build
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}Frontend build completed successfully${NC}"

# Step 4: Deployment options
echo ""
echo -e "${BLUE}Step 4: Deployment Options${NC}"
echo "----------------------------------------"
echo "Choose your deployment method:"
echo "1. Deploy to Hostinger (using existing script)"
echo "2. Manual deployment instructions"
echo "3. Test locally first"
echo ""
read -p "Enter your choice (1-3): " deployment_choice

case $deployment_choice in
    1)
        echo ""
        echo "Deploying to Hostinger..."
        if [ -f "./deploy-to-hostinger-now.sh" ]; then
            chmod +x ./deploy-to-hostinger-now.sh
            ./deploy-to-hostinger-now.sh
        else
            echo -e "${RED}Error: deploy-to-hostinger-now.sh not found${NC}"
            echo "Please deploy manually"
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Manual Deployment Instructions:${NC}"
        echo "1. Upload the 'frontend/.next' folder to your server"
        echo "2. Upload the 'frontend/public' folder to your server"
        echo "3. Install dependencies on server: npm install --production"
        echo "4. Start the application: npm start"
        echo "5. Configure your web server to proxy to the Next.js application"
        ;;
    3)
        echo ""
        echo "Starting local development server..."
        cd frontend
        npm run dev
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Step 5: Post-deployment verification
echo ""
echo -e "${BLUE}Step 5: Post-Deployment Verification${NC}"
echo "----------------------------------------"
echo "Please verify the following:"
echo ""
echo "1. Navigate to /email-tracking in your application"
echo "2. Check that the page loads without errors"
echo "3. Try creating a year folder"
echo "4. Try adding an entry"
echo "5. Test filtering functionality"
echo "6. Test access control features"
echo ""

# Step 6: Initial setup
echo ""
echo -e "${BLUE}Step 6: Initial Setup Tasks${NC}"
echo "----------------------------------------"
echo "Complete these tasks to get started:"
echo ""
echo "1. Create year folder for current year (2025)"
echo "2. Create month folders as needed"
echo "3. Add any additional email accounts"
echo "4. Set up folder access permissions for team members"
echo "5. Test the archive functionality"
echo ""

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete"
echo "==========================================${NC}"
echo ""
echo "System Features:"
echo "  - Folder-based organization (Year/Month/Week)"
echo "  - Comprehensive email tracking"
echo "  - Advanced filtering and search"
echo "  - Folder access control"
echo "  - Data archiving"
echo ""
echo "Documentation:"
echo "  - Deployment Guide: DEPLOY_EMAIL_TRACKING_SYSTEM.md"
echo "  - Database Schema: create_email_tracking_system.sql"
echo "  - Frontend Page: frontend/src/app/email-tracking/page.tsx"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create your first year folder"
echo "2. Configure team access permissions"
echo "3. Start tracking communications"
echo ""
echo "For support, refer to the documentation or contact your system administrator."
echo ""

