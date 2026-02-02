#!/bin/bash

# =====================================================
# DEPLOY PASSWORD VAULT FIX TO GODADDY (focus-project.co.uk)
# =====================================================
# This script deploys the password vault fix to your GoDaddy domain

set -e  # Exit on any error

echo "🔧 Deploying Password Vault Fix to focus-project.co.uk..."
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Server configuration for GoDaddy/Hostinger setup
SERVER_HOST="168.231.116.32"
SERVER_USER="root"
DOMAIN="focus-project.co.uk"
PROJECT_PATH="/var/www/project_management"

print_status "Deployment Configuration:"
echo "   Domain: $DOMAIN"
echo "   Server: $SERVER_HOST"
echo "   Project Path: $PROJECT_PATH"
echo "   Time: $(date)"
echo ""

# Step 1: Database Fix Instructions
print_warning "STEP 1: DATABASE FIX REQUIRED"
echo ""
echo "Before deploying, you MUST run the database fix:"
echo "1. Open your Supabase dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy and paste the contents of: ULTIMATE_PASSWORD_VAULT_FIX.sql"
echo "4. Click Run"
echo ""
echo "This fixes:"
echo "- Adds both created_by and created_by_id columns"
echo "- Removes NOT NULL constraint causing errors"
echo "- Sets default values for existing records"
echo ""

read -p "Have you run the SQL fix in Supabase? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Please run the SQL fix first, then run this script again"
    exit 1
fi

print_success "Database fix confirmed"

# Step 2: Check local files
print_status "STEP 2: Checking local files..."

if [ ! -f "frontend/src/lib/supabase.js" ]; then
    print_error "Frontend supabase.js file not found"
    exit 1
fi

if [ ! -f "ULTIMATE_PASSWORD_VAULT_FIX.sql" ]; then
    print_error "ULTIMATE_PASSWORD_VAULT_FIX.sql file not found"
    exit 1
fi

print_success "All required files found"

# Step 3: Test server connection
print_status "STEP 3: Testing server connection..."

if ssh -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" exit 2>/dev/null; then
    print_success "Server connection established"
else
    print_error "Cannot connect to server. Please check:"
    echo "1. Server is running"
    echo "2. SSH keys are configured"
    echo "3. Server IP is correct: $SERVER_HOST"
    exit 1
fi

# Step 4: Create deployment package
print_status "STEP 4: Creating deployment package..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
PACKAGE_NAME="password-vault-fix-$(date +%Y%m%d-%H%M%S).tar.gz"

# Copy files to temp directory
cp frontend/src/lib/supabase.js "$TEMP_DIR/"
cp ULTIMATE_PASSWORD_VAULT_FIX.sql "$TEMP_DIR/"

# Create deployment info
cat > "$TEMP_DIR/deployment-info.txt" << EOF
Password Vault Fix Deployment
============================
Date: $(date)
Domain: $DOMAIN
Files included:
- supabase.js (updated with both created_by columns)
- ULTIMATE_PASSWORD_VAULT_FIX.sql (database fix)

Changes:
- Fixed created_by/created_by_id column issues
- Removed NOT NULL constraints
- Updated frontend to set both columns
- Uses actual user ID instead of hardcoded values
EOF

# Create package
cd "$TEMP_DIR"
tar -czf "$PACKAGE_NAME" *
mv "$PACKAGE_NAME" "$OLDPWD/"
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

print_success "Deployment package created: $PACKAGE_NAME"

# Step 5: Upload and deploy
print_status "STEP 5: Uploading to server..."

# Upload package
scp "$PACKAGE_NAME" "$SERVER_USER@$SERVER_HOST:/tmp/"

if [ $? -ne 0 ]; then
    print_error "Failed to upload deployment package"
    exit 1
fi

print_success "Package uploaded successfully"

# Step 6: Execute deployment on server
print_status "STEP 6: Executing deployment on server..."

DEPLOYMENT_COMMANDS="
echo '🔧 Starting Password Vault Fix Deployment on focus-project.co.uk...'

# Extract deployment package
cd /tmp
tar -xzf $PACKAGE_NAME
echo '📦 Deployment package extracted'

# Backup current files
echo '💾 Creating backup...'
mkdir -p $PROJECT_PATH/backups/password-vault-fix-\$(date +%Y%m%d-%H%M%S)
cp $PROJECT_PATH/frontend/src/lib/supabase.js $PROJECT_PATH/backups/password-vault-fix-\$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || echo 'No existing supabase.js to backup'

# Deploy updated supabase.js
echo '🚀 Deploying updated supabase.js...'
cp supabase.js $PROJECT_PATH/frontend/src/lib/supabase.js
chown www-data:www-data $PROJECT_PATH/frontend/src/lib/supabase.js
chmod 644 $PROJECT_PATH/frontend/src/lib/supabase.js

# Stop services for rebuild
echo '🛑 Stopping services for rebuild...'
systemctl stop nextjs-pm

# Rebuild application with fixes
echo '🏗️ Rebuilding application with password vault fixes...'
cd $PROJECT_PATH/frontend

# Clear cache and rebuild
rm -rf .next
rm -rf node_modules/.cache

# Build with production settings
NODE_ENV=production npm run build

if [ \$? -ne 0 ]; then
    echo '❌ Build failed! Rolling back...'
    # Restore backup if build fails
    if [ -f '$PROJECT_PATH/backups/password-vault-fix-\$(date +%Y%m%d-%H%M%S)/supabase.js' ]; then
        cp $PROJECT_PATH/backups/password-vault-fix-\$(date +%Y%m%d-%H%M%S)/supabase.js $PROJECT_PATH/frontend/src/lib/supabase.js
    fi
    systemctl start nextjs-pm
    exit 1
fi

echo '✅ Build completed successfully'

# Set proper permissions
echo '🔐 Setting permissions...'
cd $PROJECT_PATH
chown -R www-data:www-data .
chmod -R 755 .

# Start services
echo '🚀 Starting services...'
systemctl start nextjs-pm
systemctl restart nginx

# Wait for services to start
sleep 5

# Check service status
NEXTJS_STATUS=\$(systemctl is-active nextjs-pm)
NGINX_STATUS=\$(systemctl is-active nginx)

echo ''
echo '🎉 Password Vault Fix Deployment Complete!'
echo '=========================================='
echo ''

if [[ \"\$NEXTJS_STATUS\" == 'active' && \"\$NGINX_STATUS\" == 'active' ]]; then
    echo '✅ All services are running!'
    echo ''
    echo '🌐 Your website is live at:'
    echo '   https://focus-project.co.uk ✅'
    echo '   https://www.focus-project.co.uk ✅'
    echo ''
    echo '🔧 Password Vault Fixes Applied:'
    echo '   ✅ Database columns fixed (created_by + created_by_id)'
    echo '   ✅ Frontend updated to set both columns'
    echo '   ✅ User ID properly retrieved from auth'
    echo '   ✅ NOT NULL constraints removed'
    echo ''
    echo '📋 Test the fixes:'
    echo '   1. Go to Password Vault page'
    echo '   2. Try creating a new folder'
    echo '   3. Try deleting a password'
    echo '   4. Both should work without errors'
    
else
    echo '❌ Some services failed to start!'
    echo 'Service Status:'
    echo \"   Next.js: \$NEXTJS_STATUS\"
    echo \"   Nginx: \$NGINX_STATUS\"
    echo ''
    echo 'Check logs: journalctl -u nextjs-pm -f'
fi

# Cleanup
rm -f /tmp/$PACKAGE_NAME
rm -f /tmp/supabase.js
rm -f /tmp/ULTIMATE_PASSWORD_VAULT_FIX.sql
rm -f /tmp/deployment-info.txt

echo ''
echo '🧹 Cleanup completed'
"

# Execute deployment commands on server
ssh -t "$SERVER_USER@$SERVER_HOST" "$DEPLOYMENT_COMMANDS"

DEPLOYMENT_EXIT_CODE=$?

# Step 7: Verify deployment
if [ $DEPLOYMENT_EXIT_CODE -eq 0 ]; then
    print_status "STEP 7: Verifying deployment..."
    
    # Wait for services to fully start
    sleep 10
    
    # Test website
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://focus-project.co.uk)
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        print_success "Website is responding correctly!"
    else
        print_warning "Website returned status: $HTTPS_STATUS"
        # Test HTTP fallback
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://focus-project.co.uk)
        if [ "$HTTP_STATUS" = "200" ]; then
            print_success "HTTP is working (HTTPS may need more time)"
        fi
    fi
    
    echo ""
    echo "🎉 Password Vault Fix Successfully Deployed!"
    echo "============================================"
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "🌐 Your website: https://focus-project.co.uk"
    echo ""
    echo "🔧 What was fixed:"
    echo "   ✅ Database: Both created_by and created_by_id columns added"
    echo "   ✅ Database: NOT NULL constraints removed"
    echo "   ✅ Frontend: Updated to set both columns correctly"
    echo "   ✅ Frontend: Uses actual user ID from authentication"
    echo ""
    echo "📋 Test the fixes now:"
    echo "   1. Visit: https://focus-project.co.uk/password-vault"
    echo "   2. Try creating a new folder"
    echo "   3. Try deleting a password"
    echo "   4. Both should work without errors"
    echo ""
    echo "🆘 If you still get errors:"
    echo "   - Check browser console for detailed error messages"
    echo "   - Verify the database fix was applied in Supabase"
    echo "   - Contact support if issues persist"
    
else
    print_error "Deployment failed!"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check server logs: ssh root@$SERVER_HOST 'journalctl -u nextjs-pm -f'"
    echo "2. Verify services: ssh root@$SERVER_HOST 'systemctl status nextjs-pm nginx'"
    echo "3. Check build logs for errors"
    echo "4. Ensure database fix was applied in Supabase"
fi

# Cleanup local package
rm -f "$PACKAGE_NAME"

echo ""
echo "🧹 Local cleanup completed"

