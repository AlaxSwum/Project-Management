#!/bin/bash

# ========================================
# EMAIL TRACKING SYSTEM - DEPLOYMENT COMMANDS
# Run these commands to deploy to Hostinger
# ========================================

echo "=========================================="
echo "EMAIL TRACKING SYSTEM DEPLOYMENT"
echo "=========================================="
echo ""
echo "The frontend is built and ready!"
echo ""
echo "Choose your deployment method:"
echo ""
echo "1. Deploy via Git (Recommended)"
echo "2. Manual SSH Deployment"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "=========================================="
    echo "METHOD 1: GIT DEPLOYMENT"
    echo "=========================================="
    echo ""
    echo "Step 1: Commit and push changes"
    echo "------------------------------------"
    
    cd /Users/swumpyaesone/Documents/project_management
    
    # Add new files
    git add frontend/src/app/email-tracking/page.tsx
    git add create_email_tracking_system.sql
    git add DEPLOY_EMAIL_TRACKING_SYSTEM.md
    git add EMAIL_TRACKING_QUICK_START.md
    git add EMAIL_TRACKING_SYSTEM_SUMMARY.md
    git add DEPLOY_EMAIL_TRACKING_NOW.md
    
    echo ""
    echo "Files staged for commit..."
    echo ""
    
    git commit -m "Add Email Tracking System for Rother Care Pharmacy

- Complete email and project tracking system
- Folder-based organization (Year/Month/Week)
- 10 tracking columns with advanced filtering
- Folder access control with 3 permission levels
- Email account management
- Archive functionality
- Clean professional UI (no emojis)
- Full database schema with RLS
- Comprehensive documentation"
    
    echo ""
    echo "Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Code pushed successfully!"
        echo ""
        echo "=========================================="
        echo "NOW RUN THESE COMMANDS ON YOUR SERVER:"
        echo "=========================================="
        echo ""
        echo "ssh root@srv875725.hstgr.cloud"
        echo ""
        echo "cd /var/www/project_management"
        echo ""
        echo "# Pull latest code"
        echo "git pull origin main"
        echo ""
        echo "# Rebuild frontend"
        echo "cd frontend"
        echo "npm install"
        echo "npm run build"
        echo ""
        echo "# Restart service"
        echo "cd .."
        echo "systemctl restart nextjs-pm"
        echo ""
        echo "# Verify deployment"
        echo "systemctl status nextjs-pm"
        echo ""
        echo "=========================================="
    else
        echo "❌ Git push failed. Check your git configuration."
        exit 1
    fi
    
elif [ "$choice" == "2" ]; then
    echo ""
    echo "=========================================="
    echo "METHOD 2: MANUAL SSH DEPLOYMENT"
    echo "=========================================="
    echo ""
    echo "Copy and paste these commands into your terminal:"
    echo ""
    echo "# 1. Connect to server"
    echo "ssh root@srv875725.hstgr.cloud"
    echo ""
    echo "# 2. Navigate to project"
    echo "cd /var/www/project_management"
    echo ""
    echo "# 3. Pull latest code"
    echo "git pull origin main"
    echo ""
    echo "# 4. Rebuild frontend"
    echo "cd frontend"
    echo "npm install"
    echo "npm run build"
    echo ""
    echo "# 5. Restart service"
    echo "cd .."
    echo "systemctl restart nextjs-pm"
    echo ""
    echo "# 6. Check status"
    echo "systemctl status nextjs-pm"
    echo ""
else
    echo "Invalid choice"
    exit 1
fi

echo ""
echo "=========================================="
echo "IMPORTANT: DATABASE DEPLOYMENT"
echo "=========================================="
echo ""
echo "Don't forget to deploy the database!"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Open SQL Editor"
echo "3. Copy ALL contents from:"
echo "   create_email_tracking_system.sql"
echo "4. Paste into SQL Editor"
echo "5. Click 'Run'"
echo "6. Wait for success message"
echo ""
echo "=========================================="
echo "AFTER DEPLOYMENT"
echo "=========================================="
echo ""
echo "1. Visit: https://srv875725.hstgr.cloud/email-tracking"
echo "2. Create year folder: 2025"
echo "3. Add your first entry"
echo "4. Set up team access permissions"
echo ""
echo "📖 Documentation:"
echo "   - Quick Start: EMAIL_TRACKING_QUICK_START.md"
echo "   - Full Guide: DEPLOY_EMAIL_TRACKING_SYSTEM.md"
echo ""
echo "=========================================="
echo "DEPLOYMENT READY!"
echo "=========================================="

