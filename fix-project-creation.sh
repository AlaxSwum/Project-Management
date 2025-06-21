#!/bin/bash

# 🔧 Fix Project Creation Issue on Hostinger
# Run this script on your Hostinger server: 168.231.116.32

set -e  # Exit on any error

echo "🔧 Fixing Project Creation Issue..."
echo "📍 Server: $(hostname -I | awk '{print $1}')"
echo "📅 Time: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# STEP 1: Update the code
print_step "1/4 - Updating project code..."
cd /var/www/project_management

# Pull latest changes from GitHub
git pull origin main

print_status "Code updated!"

# STEP 2: Rebuild the frontend
print_step "2/4 - Rebuilding frontend..."
cd frontend

# Install any new dependencies
npm install

# Build production version
npm run build

print_status "Frontend rebuilt!"

# STEP 3: Restart the Next.js service
print_step "3/4 - Restarting Next.js service..."
systemctl restart nextjs-pm

# Wait a moment for service to start
sleep 3

print_status "Service restarted!"

# STEP 4: Verify the fix
print_step "4/4 - Verifying deployment..."

if systemctl is-active --quiet nextjs-pm; then
    print_status "✅ Next.js service is running"
else
    echo -e "${RED}[ERROR]${NC} ❌ Next.js service is not running"
    exit 1
fi

# Show recent logs
echo ""
echo "📋 Recent logs (last 5 lines):"
journalctl -u nextjs-pm --no-pager -n 5

echo ""
echo "🎉 Project Creation Fix Deployed Successfully!"
echo ""
echo "✅ Changes Applied:"
echo "  - Fixed createProject function to add creator as member"
echo "  - Added proper created_by_id field"
echo "  - Added error handling and logging"
echo ""
echo "🌐 Test the fix at: http://168.231.116.32:3000"
echo "📧 Login: admin@project.com / admin123"
echo ""
echo "🧪 Test Steps:"
echo "1. Login to the application"
echo "2. Go to Dashboard"
echo "3. Click 'Create Project'"
echo "4. Fill in project name and description"
echo "5. Click 'Create Project'"
echo "6. Project should now appear in your projects list"
echo ""
echo "🔧 If you still have issues:"
echo "- Check logs: journalctl -u nextjs-pm -f"
echo "- Check database tables: projects_project and projects_project_members"
echo "- Verify user authentication is working" 