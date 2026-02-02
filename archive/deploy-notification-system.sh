#!/bin/bash

# 🚀 DEPLOY NOTIFICATION SYSTEM
# This script deploys the complete notification system with Brevo integration

echo "🚀 Deploying Notification System..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Step 1: Committing notification system changes..."
git add .
git commit -m "Implement comprehensive notification system

Features:
- Brevo email integration for task assignments and reminders
- Real-time in-app notifications with dropdown UI
- Task assignment notifications (instant)
- 1-day ahead task reminder emails
- Beautiful HTML email templates matching website UI
- Notification management (mark as read, view all)
- Database schema updates for notification types
- API endpoints for cron job reminders and testing
- Complete notification service architecture

Technical:
- Added NotificationDropdown component to sidebar
- Enhanced task creation/update handlers with notifications
- Brevo service for email templates and sending
- Notification service for unified notification management
- Database migrations for notification types
- Cron job setup documentation
- Test endpoints for system verification"

if [ $? -eq 0 ]; then
    print_success "Changes committed successfully"
else
    print_warning "Commit failed or no changes to commit"
fi

print_status "Step 2: Pushing to remote repository..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Code pushed to repository"
else
    print_error "Failed to push to repository"
    exit 1
fi

print_status "Step 3: Database Updates Required"
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo "=========================="
echo ""
echo "1. 🗄️  UPDATE SUPABASE DATABASE:"
echo "   - Go to your Supabase dashboard"
echo "   - Open SQL Editor"
echo "   - Run the SQL script: update_notifications_table.sql"
echo "   - This adds new notification types and indexes"
echo ""
echo "2. 🔑 SET ENVIRONMENT VARIABLES:"
echo "   Add these to your deployment environment:"
echo ""
echo "   BREVO_API_KEY=your-brevo-api-key-here"
echo "   CRON_SECRET=your-secure-secret-key-here"
echo "   NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com"
echo ""
echo "3. ⏰ SETUP DAILY REMINDERS:"
echo "   Choose one option from setup-daily-reminders.md:"
echo "   - Vercel Cron Jobs (recommended for Vercel)"
echo "   - GitHub Actions (free option)"
echo "   - External cron services (cron-job.org)"
echo "   - Server cron (if you have a server)"
echo ""
echo "4. 🧪 TEST THE SYSTEM:"
echo "   After deployment, test with:"
echo ""
echo "   # Test basic email functionality"
echo "   curl -X POST \"https://your-domain.com/api/test-notifications\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\": \"your-email@example.com\", \"testType\": \"basic\"}'"
echo ""
echo "   # Test task assignment email"
echo "   curl -X POST \"https://your-domain.com/api/test-notifications\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\": \"your-email@example.com\", \"testType\": \"task-assignment\"}'"
echo ""
echo "   # Test reminder email"
echo "   curl -X POST \"https://your-domain.com/api/test-notifications\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\": \"your-email@example.com\", \"testType\": \"task-reminder\"}'"
echo ""

# Check if we're running on Hostinger server
if [[ $(hostname) == *"hstgr"* ]] || [[ -d "/var/www/project_management" ]]; then
    print_status "Step 4: Deploying to Hostinger server..."
    
    # Navigate to project directory
    cd /var/www/project_management
    
    # Stop services
    print_status "Stopping services..."
    systemctl stop nextjs-pm || echo "Service not running"
    
    # Pull latest code
    print_status "Pulling latest code..."
    git pull origin main
    
    # Clear cache and rebuild
    print_status "Building application..."
    cd frontend
    rm -rf .next node_modules package-lock.json
    npm install
    npm run build
    
    # Set permissions
    print_status "Setting permissions..."
    cd ..
    chown -R www-data:www-data /var/www/project_management
    chmod -R 755 /var/www/project_management
    
    # Start service
    print_status "Starting service..."
    systemctl start nextjs-pm
    
    # Check status
    sleep 3
    if systemctl is-active --quiet nextjs-pm; then
        print_success "Deployment successful!"
        echo ""
        print_success "🌐 Your app is running at: https://srv875725.hstgr.cloud"
        echo ""
        print_warning "⚠️  Don't forget to complete the manual steps above!"
    else
        print_error "Service failed to start"
        echo "Check logs: journalctl -u nextjs-pm -f"
    fi
else
    print_status "Step 4: Deploy to your hosting platform"
    echo ""
    print_warning "Not on Hostinger server. Deploy manually to your hosting platform."
    echo ""
    echo "For Hostinger deployment:"
    echo "ssh root@srv875725.hstgr.cloud"
    echo "cd /var/www/project_management"
    echo "./deploy-notification-system.sh"
fi

echo ""
print_success "🎉 Notification System Deployment Complete!"
echo ""
echo "📋 SUMMARY OF FEATURES DEPLOYED:"
echo "================================="
echo "✅ Email notifications via Brevo API"
echo "✅ Task assignment notifications (instant)"
echo "✅ 1-day ahead task reminder emails"
echo "✅ Beautiful HTML email templates"
echo "✅ Real-time in-app notifications"
echo "✅ Notification dropdown in sidebar"
echo "✅ Task status change notifications"
echo "✅ Notification management (mark as read)"
echo "✅ Database schema for notifications"
echo "✅ API endpoints for cron jobs"
echo "✅ Test endpoints for verification"
echo "✅ Comprehensive documentation"
echo ""
echo "🔗 NEXT STEPS:"
echo "=============="
echo "1. Complete the manual database and environment setup above"
echo "2. Set up daily reminder cron job"
echo "3. Test the notification system"
echo "4. Monitor email delivery in Brevo dashboard"
echo "5. Check notification functionality in the app"
echo ""
print_success "Happy managing! 🚀"
