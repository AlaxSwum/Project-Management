#!/bin/bash

# =====================================================
# DEPLOY PASSWORD VAULT FOLDERS FIX
# =====================================================
# This script deploys the fix for the missing created_by column in password_vault_folders

set -e  # Exit on any error

echo "🔧 Starting Password Vault Folders Fix Deployment..."

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
if [ ! -f "fix_password_vault_folders_created_by.sql" ]; then
    print_error "fix_password_vault_folders_created_by.sql not found in current directory"
    exit 1
fi

print_status "Found SQL fix file"

# Check if we have SSH access to the server
print_status "Checking server connection..."

# Server details (update these with your actual server details)
SERVER_USER="u169655530"
SERVER_HOST="srv1085.hstgr.io"
SERVER_PATH="/domains/focusproject.me/public_html"

# Test SSH connection
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "${SERVER_USER}@${SERVER_HOST}" exit 2>/dev/null; then
    print_error "Cannot connect to server via SSH"
    print_warning "Please ensure SSH keys are set up correctly"
    exit 1
fi

print_success "Server connection established"

# Upload the SQL fix file
print_status "Uploading SQL fix file to server..."
scp "fix_password_vault_folders_created_by.sql" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

if [ $? -eq 0 ]; then
    print_success "SQL file uploaded successfully"
else
    print_error "Failed to upload SQL file"
    exit 1
fi

# Create a deployment script on the server
print_status "Creating deployment script on server..."

ssh "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
cd /domains/focusproject.me/public_html

# Create a simple deployment log
echo "$(date): Starting password vault folders fix deployment" >> deployment.log

# Check if the SQL file exists
if [ ! -f "fix_password_vault_folders_created_by.sql" ]; then
    echo "ERROR: SQL file not found on server" >> deployment.log
    exit 1
fi

echo "SQL file found on server" >> deployment.log
echo "$(date): Password vault folders fix deployment completed" >> deployment.log
EOF

if [ $? -eq 0 ]; then
    print_success "Deployment script executed successfully"
else
    print_error "Failed to execute deployment script"
    exit 1
fi

# Instructions for manual database execution
print_warning "IMPORTANT: Manual Database Step Required"
echo ""
echo "The SQL fix file has been uploaded to your server at:"
echo "${SERVER_PATH}/fix_password_vault_folders_created_by.sql"
echo ""
echo "To complete the fix, you need to:"
echo "1. Log into your Supabase dashboard"
echo "2. Go to the SQL Editor"
echo "3. Copy and paste the contents of fix_password_vault_folders_created_by.sql"
echo "4. Execute the SQL script"
echo ""
echo "Alternatively, if you have direct database access:"
echo "psql -h [your-db-host] -U [your-db-user] -d [your-db-name] -f fix_password_vault_folders_created_by.sql"
echo ""

# Create a quick verification script
print_status "Creating verification script..."

cat > verify_password_vault_fix.sql << 'EOF'
-- Verification script for password vault folders fix
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
AND column_name IN ('created_by_id', 'created_by')
ORDER BY column_name;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'password_vault_folders';

-- Check existing policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'password_vault_folders';
EOF

scp "verify_password_vault_fix.sql" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

print_success "Verification script uploaded"

print_success "Deployment completed successfully!"
print_warning "Don't forget to execute the SQL script in your database!"

echo ""
echo "Files uploaded to server:"
echo "- fix_password_vault_folders_created_by.sql (main fix)"
echo "- verify_password_vault_fix.sql (verification queries)"
echo ""
echo "Next steps:"
echo "1. Execute the SQL fix in your database"
echo "2. Test folder creation in the password vault"
echo "3. Run verification queries to confirm the fix"

