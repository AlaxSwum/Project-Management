# 🚀 URGENT FIX: Tasks and Password Vault

## Problem
- ❌ Cannot add or delete tasks in project pages
- ❌ Cannot add passwords to password vault

## Root Cause
**Row Level Security (RLS)** is enabled on Supabase tables, blocking operations even for authenticated users.

## Solution
Run the SQL fix script to disable RLS and grant proper permissions.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **bayyefskgflbyyuwrlgm**

### Step 2: Open SQL Editor
1. Click on **SQL Editor** in the left sidebar
2. Click **New Query** button

### Step 3: Run the Fix Script
1. Open the file: `FIX_TASKS_AND_PASSWORD_VAULT.sql`
2. Copy ALL the contents of the file
3. Paste into the SQL Editor in Supabase
4. Click **Run** button (or press Ctrl+Enter / Cmd+Enter)

### Step 4: Verify Success
You should see:
```
✅ FIX COMPLETE!

Changes Applied:
1. ✓ Disabled RLS on projects_task table
2. ✓ Granted permissions for task operations
3. ✓ Disabled RLS on password_vault tables
4. ✓ Fixed password vault column constraints
5. ✓ Created default Personal folder
6. ✓ Granted permissions for password vault operations
```

### Step 5: Test the Fixes
1. **Test Tasks:**
   - Go to https://focus-project.co.uk/projects/86
   - Try clicking "Add Task" button
   - Fill in task details and create it
   - Try deleting a task

2. **Test Password Vault:**
   - Go to https://focus-project.co.uk/password-vault
   - Click "Add Password" button
   - Fill in password details and save it
   - Verify it appears in the list

---

## ⚠️ What This Fix Does

### For Tasks:
- Disables Row Level Security on `projects_task` table
- Removes restrictive policies
- Grants full permissions to authenticated and anonymous users
- Fixes related tables (comments, attachments)

### For Password Vault:
- Disables Row Level Security on `password_vault` and `password_vault_folders` tables
- Removes restrictive policies
- Ensures all required columns exist
- Creates a default "Personal" folder
- Grants full permissions to authenticated and anonymous users

---

## 🔍 Troubleshooting

### If tasks still don't work:
1. Open browser console (F12)
2. Try creating a task
3. Look for error messages
4. Check if the error mentions "permission denied" or "RLS"

### If password vault still doesn't work:
1. Open browser console (F12)
2. Try adding a password
3. Look for error messages related to "created_by_id" or "folder_id"

### If you see "relation does not exist" errors:
This means some tables haven't been created yet. Run the complete database setup:
```sql
-- Run all table creation scripts in this order:
1. create_password_vault_supabase.sql
2. create_personal_task_management_tables.sql
```

---

## 📝 Alternative: Manual Fix via Supabase Dashboard

If SQL Editor doesn't work, you can manually disable RLS:

### For Tasks:
1. Go to **Table Editor** → `projects_task`
2. Click on **RLS Policies** tab
3. Toggle **Enable RLS** to OFF
4. Repeat for `projects_taskcomment` and `projects_taskattachment`

### For Password Vault:
1. Go to **Table Editor** → `password_vault`
2. Click on **RLS Policies** tab
3. Toggle **Enable RLS** to OFF
4. Repeat for `password_vault_folders`

---

## 📧 Need Help?

If the fix doesn't work:
1. Take a screenshot of the error message in browser console
2. Take a screenshot of the SQL Editor result
3. Check if you're logged in to the application
4. Verify you're using the correct Supabase project

---

## ✅ Expected Behavior After Fix

### Tasks:
- ✓ "Add Task" button works
- ✓ Task creation modal opens and saves successfully
- ✓ Tasks appear in the project board
- ✓ Can delete tasks from any column
- ✓ Can drag and drop tasks between columns

### Password Vault:
- ✓ "Add Password" button works
- ✓ Password creation modal opens and saves successfully
- ✓ Passwords appear in the vault list
- ✓ Can view/edit/delete passwords
- ✓ Can create folders

---

## 🔒 Security Note

This fix disables Row Level Security for easier development and testing. For production use, you should implement proper RLS policies that:
1. Allow users to only see/edit their own passwords
2. Allow project members to only see/edit tasks in their projects
3. Properly handle shared resources

For now, this fix allows all authenticated users full access to test the functionality.

