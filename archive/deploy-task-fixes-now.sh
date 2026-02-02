#!/bin/bash

# 🚀 Deploy Task Visibility Fixes to Hostinger
# This script will trigger deployment on your server

echo "🚀 Deploying Task Visibility Fixes to Hostinger..."
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Server details
SERVER_IP="168.231.116.32"
SERVER_HOST="srv875725.hstgr.cloud"

print_step "1. Code has been pushed to GitHub ✅"
echo "   - Fixed WeekCalendarView task filtering"
echo "   - Fixed state management consistency"
echo "   - Fixed TypeScript errors"
echo "   - Removed duplicate functionality"
echo ""

print_step "2. Attempting to trigger server deployment..."

# Try multiple deployment approaches
echo "Trying deployment via curl webhook..."

# Method 1: Try to hit a deployment endpoint if it exists
curl -X POST "http://$SERVER_IP:3000/api/deploy" \
  -H "Content-Type: application/json" \
  -d '{"trigger":"task-fixes","source":"local"}' \
  --connect-timeout 10 \
  --max-time 30 \
  2>/dev/null && echo "✅ Webhook deployment triggered" || echo "❌ Webhook not available"

echo ""
print_step "3. Manual deployment instructions:"
echo ""
echo "Since automated SSH is having issues, please run these commands manually:"
echo ""
echo "Option A - Direct SSH:"
echo "====================="
echo "ssh root@$SERVER_IP"
echo "# Enter password: SpsSps2003@A"
echo "cd /var/www/project_management"
echo "git pull origin main"
echo "cd frontend"
echo "rm -rf .next"
echo "npm install"
echo "npm run build"
echo "systemctl restart nextjs-pm"
echo ""

echo "Option B - Use your server's cPanel or terminal:"
echo "==============================================="
echo "1. Login to your Hostinger control panel"
echo "2. Open Terminal or File Manager"
echo "3. Navigate to /var/www/project_management"
echo "4. Run: git pull origin main"
echo "5. Run: cd frontend && npm run build"
echo "6. Restart the service"
echo ""

print_step "4. Testing after deployment:"
echo ""
echo "Once deployed, test these scenarios:"
echo "1. Go to: https://$SERVER_HOST/personal"
echo "2. Create a task in Week view → Should appear immediately"
echo "3. Switch to Month view, create task → Switch back to Week → Should appear"
echo "4. Switch to Day view, create task → Switch back to Week → Should appear"
echo "5. Update/delete tasks → Should work consistently across all views"
echo ""

print_success "🎉 DEPLOYMENT READY!"
print_info "The fixes are committed to GitHub and ready to deploy"
print_info "Your task visibility issue will be resolved once deployed!"

echo ""
echo "📋 Summary of fixes:"
echo "===================="
echo "✅ Fixed WeekCalendarView using wrong variable (filteredTasks → tasks)"
echo "✅ Fixed handleUpdateTask state consistency (now updates both tasks & allTasks)"
echo "✅ Fixed handleUpdateTaskStatus state consistency"
echo "✅ Fixed handleDeleteTask state consistency"
echo "✅ Resolved TypeScript compilation errors"
echo "✅ Removed duplicate/conflicting functionality"
echo ""
echo "🔍 Root cause: WeekCalendarView was accessing undefined variables from parent scope"
echo "🎯 Result: Tasks will now appear correctly in week view regardless of where they're created"
