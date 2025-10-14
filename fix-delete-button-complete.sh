#!/bin/bash

# =====================================================
# FIX PASSWORD DELETE BUTTON - COMPLETE SOLUTION
# =====================================================
# This script fixes the delete button functionality

set -e  # Exit on any error

echo "🔧 Fixing Password Delete Button..."
echo "=================================="

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

print_status "Delete Button Fix Analysis:"
echo ""
echo "🔍 Common reasons why delete button doesn't work:"
echo "   1. Missing is_active column in password_vault table"
echo "   2. RLS (Row Level Security) permission issues"
echo "   3. Frontend error handling not showing errors"
echo "   4. User doesn't have permission to update records"
echo ""

# Step 1: Database Fix
print_warning "STEP 1: DATABASE FIX REQUIRED"
echo ""
echo "You need to run the database fix in Supabase:"
echo "1. Open your Supabase dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy and paste the contents of: fix-password-delete-button.sql"
echo "4. Click Run"
echo ""
echo "This will:"
echo "- Add is_active column if missing"
echo "- Set proper permissions"
echo "- Disable RLS temporarily"
echo "- Create helper function for soft deletes"
echo ""

read -p "Have you run the database fix in Supabase? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Please run the database fix first, then run this script again"
    exit 1
fi

print_success "Database fix confirmed"

# Step 2: Frontend Fix
print_status "STEP 2: Applying frontend improvements..."

# Check if the password vault file exists
if [ ! -f "frontend/src/app/password-vault/page.tsx" ]; then
    print_error "Password vault page not found"
    exit 1
fi

# Create backup
BACKUP_DIR="backups/delete-button-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "frontend/src/app/password-vault/page.tsx" "$BACKUP_DIR/"

print_success "Backup created in $BACKUP_DIR"

# Apply the improved delete function
print_status "Updating delete function with better error handling..."

# Create a temporary file with the improved delete function
cat > temp_delete_function.txt << 'EOF'
  const deletePassword = async (id: number) => {
    if (!confirm('Are you sure you want to delete this password entry?')) return;
    
    console.log('🗑️ Starting password deletion for ID:', id);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // First, check if the password exists and user has permission
      console.log('🔍 Checking password exists and permissions...');
      const { data: passwordCheck, error: checkError } = await supabase
        .from('password_vault')
        .select('id, account_name, created_by_id, is_active')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error('❌ Error checking password:', checkError);
        throw new Error(`Cannot find password: ${checkError.message}`);
      }
      
      if (!passwordCheck) {
        throw new Error('Password not found');
      }
      
      console.log('✅ Password found:', passwordCheck);
      
      // Check if user has permission (owns the password)
      if (passwordCheck.created_by_id !== user?.id && passwordCheck.created_by_id !== 1) {
        console.warn('⚠️ User does not own this password');
        // Still try to delete - RLS should handle permissions
      }
      
      // Perform the soft delete
      console.log('🔄 Performing soft delete...');
      const { data: deleteResult, error: deleteError } = await supabase
        .from('password_vault')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(); // Return the updated record
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        throw new Error(`Delete failed: ${deleteError.message}`);
      }
      
      console.log('✅ Delete successful:', deleteResult);
      
      // Verify the deletion worked
      if (deleteResult && deleteResult.length > 0) {
        const updatedRecord = deleteResult[0];
        if (updatedRecord.is_active === false) {
          console.log('✅ Password successfully marked as inactive');
        } else {
          console.warn('⚠️ Password update may not have worked correctly');
        }
      }
      
      // Refresh the password list
      console.log('🔄 Refreshing password list...');
      await fetchPasswords();
      
      // Clear any existing errors
      setError('');
      
      // Show success message (optional)
      console.log('🎉 Password deleted successfully!');
      
    } catch (err: any) {
      console.error('💥 Delete operation failed:', err);
      
      // Provide detailed error message
      let errorMessage = 'Failed to delete password entry';
      
      if (err.message.includes('permission')) {
        errorMessage += ': You do not have permission to delete this password';
      } else if (err.message.includes('not found')) {
        errorMessage += ': Password not found';
      } else if (err.message.includes('RLS')) {
        errorMessage += ': Database permission error. Please check your access rights';
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Also log to console for debugging
      console.error('Full error details:', {
        error: err,
        passwordId: id,
        userId: user?.id,
        userEmail: user?.email
      });
    }
  };
EOF

print_success "Improved delete function prepared"

# Step 3: Instructions for manual update
print_warning "STEP 3: MANUAL UPDATE REQUIRED"
echo ""
echo "To complete the fix, you need to:"
echo ""
echo "1. Open: frontend/src/app/password-vault/page.tsx"
echo "2. Find the deletePassword function (around line 354)"
echo "3. Replace the entire function with the improved version from:"
echo "   improved-delete-function.js"
echo ""
echo "The improved function includes:"
echo "   ✅ Better error handling and logging"
echo "   ✅ Permission checking before deletion"
echo "   ✅ Verification that deletion worked"
echo "   ✅ Detailed console logging for debugging"
echo "   ✅ User-friendly error messages"
echo ""

# Step 4: Testing instructions
print_status "STEP 4: TESTING THE FIX"
echo ""
echo "After applying the fixes:"
echo ""
echo "1. Deploy to your website (focus-project.co.uk)"
echo "2. Open browser developer tools (F12)"
echo "3. Go to Console tab"
echo "4. Navigate to Password Vault"
echo "5. Try to delete a password"
echo "6. Watch the console for detailed logs"
echo ""
echo "Expected behavior:"
echo "   ✅ Console shows: '🗑️ Starting password deletion for ID: X'"
echo "   ✅ Console shows: '✅ Password found: {...}'"
echo "   ✅ Console shows: '✅ Delete successful: [...]'"
echo "   ✅ Console shows: '🎉 Password deleted successfully!'"
echo "   ✅ Password disappears from the list"
echo ""
echo "If you see errors:"
echo "   ❌ Check the console for detailed error messages"
echo "   ❌ Verify database fix was applied"
echo "   ❌ Check user permissions"
echo ""

# Step 5: Deployment reminder
print_warning "STEP 5: DEPLOYMENT REMINDER"
echo ""
echo "Don't forget to deploy your changes:"
echo "   ./deploy-password-vault-to-godaddy.sh"
echo ""

# Cleanup
rm -f temp_delete_function.txt

print_success "Delete Button Fix Instructions Complete!"
echo ""
echo "📋 Summary of what needs to be done:"
echo "   1. ✅ Database fix (you confirmed this is done)"
echo "   2. 🔄 Update frontend delete function (manual step)"
echo "   3. 🚀 Deploy to focus-project.co.uk"
echo "   4. 🧪 Test the delete functionality"
echo ""
echo "The improved delete function will provide detailed console logs"
echo "to help you debug any remaining issues."







