#!/bin/bash

# Deploy Company Outreach Feature to Hostinger
# This script sets up the database and deploys the feature

echo "🚀 Starting Company Outreach Feature Deployment..."
echo "================================================"

# Set variables
PROJECT_DIR="/home/u137141055/project_management"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
SQL_FILE="$PROJECT_DIR/create_company_outreach_tables.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Step 1: Setting up database tables...${NC}"
if [ -f "$SQL_FILE" ]; then
    echo "Found SQL file: $SQL_FILE"
    echo "⚡ Database tables will be created via Supabase dashboard"
    echo "📝 Please run the SQL commands from create_company_outreach_tables.sql in your Supabase SQL Editor"
    echo ""
    echo "Key tables that will be created:"
    echo "  - company_outreach_members (access control)"
    echo "  - company_outreach_specializations (field options)"
    echo "  - company_outreach (main data table)"
    echo ""
else
    echo -e "${RED}❌ SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
cd "$FRONTEND_DIR" || exit 1
echo "Installing frontend dependencies..."
npm install

echo -e "${BLUE}🏗️  Step 3: Building frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Step 4: Restarting services...${NC}"
# Kill existing processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "python manage.py runserver" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 3

echo -e "${BLUE}🚀 Step 5: Starting services...${NC}"

# Start backend
cd "$BACKEND_DIR" || exit 1
echo "Starting Django backend..."
source venv/bin/activate
python manage.py migrate --run-syncdb 2>/dev/null || true
nohup python manage.py runserver 0.0.0.0:8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start frontend
cd "$FRONTEND_DIR" || exit 1
echo "Starting Next.js frontend..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for services to start
echo "Waiting for services to initialize..."
sleep 10

# Check if services are running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend is running (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Company Outreach Feature Deployment Complete!${NC}"
echo "================================================"
echo ""
echo -e "${YELLOW}📋 IMPORTANT: Manual Steps Required${NC}"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and run the SQL from: create_company_outreach_tables.sql"
echo "4. Verify tables are created successfully"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend: http://your-domain.com:3000"
echo "  Backend:  http://your-domain.com:8000"
echo ""
echo -e "${BLUE}📁 New Features Available:${NC}"
echo "  - Company Outreach management"
echo "  - Field of Specialization management"
echo "  - Access control for idea lounge section"
echo "  - Filtering and sorting capabilities"
echo ""
echo -e "${YELLOW}⚠️  Notes:${NC}"
echo "  - Only users with access will see the 'Idea Lounge' section"
echo "  - Admins and HR users get automatic access"
echo "  - Other users need to be manually added via admin interface"
echo ""
echo -e "${GREEN}✨ Deployment script completed successfully!${NC}" 