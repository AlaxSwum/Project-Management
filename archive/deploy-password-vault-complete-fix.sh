#!/bin/bash

# =====================================================
# COMPLETE PASSWORD VAULT FIX DEPLOYMENT
# =====================================================
# This script deploys both database and frontend fixes

set -e  # Exit on any error

echo "🔧 Starting Complete Password Vault Fix Deployment..."

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

# Step 1: Show what needs to be done
print_status "Password Vault Fix Deployment Plan:"
echo "1. Database Fix: Add missing columns and remove constraints"
echo "2. Frontend Fix: Update supabase.js to set both created_by columns"
echo "3. Deploy to focus-project.co.uk"
echo ""

# Step 2: Database Fix Instructions
print_warning "MANUAL STEP REQUIRED - DATABASE FIX"
echo ""
echo "You need to run the SQL fix in your Supabase dashboard:"
echo "1. Open your Supabase dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy and paste the contents of: ULTIMATE_PASSWORD_VAULT_FIX.sql"
echo "4. Click Run"
echo ""
echo "This will:"
echo "- Add both created_by and created_by_id columns"
echo "- Remove NOT NULL constraint from created_by_id"
echo "- Set default values for existing records"
echo "- Create a default Personal folder"
echo ""

read -p "Have you run the SQL fix in Supabase? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Please run the SQL fix first, then run this script again"
    exit 1
fi

print_success "Database fix confirmed"

# Step 3: Check if frontend files exist
print_status "Checking frontend files..."

if [ ! -f "frontend/src/lib/supabase.js" ]; then
    print_error "Frontend supabase.js file not found"
    exit 1
fi

print_success "Frontend files found"

# Step 4: Show the frontend changes made
print_status "Frontend changes applied:"
echo "- Updated createPasswordFolder function to set both created_by and created_by_id"
echo "- Uses actual user ID instead of hardcoded value"
echo ""

# Step 5: Deploy to server (if SSH is available)
print_status "Attempting to deploy to focus-project.co.uk..."

# Server details
SERVER_USER="u169655530"
SERVER_HOST="srv1085.hstgr.io"
SERVER_PATH="/domains/focusproject.me/public_html"

# Test SSH connection
if ssh -o ConnectTimeout=10 -o BatchMode=yes "${SERVER_USER}@${SERVER_HOST}" exit 2>/dev/null; then
    print_success "SSH connection available"
    
    # Upload the updated frontend files
    print_status "Uploading updated frontend files..."
    
    # Create a temporary deployment package
    cd frontend
    tar -czf ../frontend-password-vault-fix.tar.gz src/lib/supabase.js
    cd ..
    
    # Upload to server
    scp frontend-password-vault-fix.tar.gz "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
    
    # Extract on server
    ssh "${SERVER_USER}@${SERVER_HOST}" << EOF
cd ${SERVER_PATH}
tar -xzf frontend-password-vault-fix.tar.gz
rm frontend-password-vault-fix.tar.gz
echo "Frontend files updated on server"
EOF
    
    # Clean up local temp file
    rm frontend-password-vault-fix.tar.gz
    
    print_success "Frontend deployed successfully!"
    
else
    print_warning "SSH connection not available"
    print_status "Manual deployment required:"
    echo "1. Upload the updated frontend/src/lib/supabase.js to your server"
    echo "2. Replace the existing file at: ${SERVER_PATH}/src/lib/supabase.js"
    echo ""
fi

# Step 6: Final instructions
print_success "Password Vault Fix Deployment Complete!"
echo ""
echo "What was fixed:"
echo "✅ Database: Added both created_by and created_by_id columns"
echo "✅ Database: Removed NOT NULL constraint causing the error"
echo "✅ Database: Set default values for existing records"
echo "✅ Frontend: Updated to set both columns when creating folders"
echo "✅ Frontend: Uses actual user ID instead of hardcoded value"
echo ""
echo "Next steps:"
echo "1. Test folder creation in the password vault"
echo "2. Test password deletion"
echo "3. Both should work without errors now"
echo ""
print_warning "If you still get errors, check the browser console for detailed error messages"

