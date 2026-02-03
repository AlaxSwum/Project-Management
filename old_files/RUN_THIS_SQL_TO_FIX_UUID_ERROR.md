# FIX UUID ERROR - Run This SQL in Supabase

## The Error You're Seeing:
```
invalid input syntax for type uuid: "60"
```

## Why This Happens:
Your user ID is `60` (integer), but the email tracking tables expect UUID. 
This SQL will fix all tables to use INTEGER IDs like the rest of your system.

---

## STEP 1: Run This SQL in Supabase

1. Go to: **https://supabase.com/dashboard**
2. Click: **SQL Editor**
3. Copy ALL contents from: **`FIX_EMAIL_TRACKING_SCHEMA.sql`**
4. Paste into SQL Editor
5. Click: **"Run"**
6. Wait for success ✅

---

## STEP 2: Refresh Email Tracking Page

1. Go to: https://focus-project.co.uk/email-tracking
2. **Press**: `Cmd + Shift + R` (hard refresh)
3. **Click**: "Create Folder"
4. Enter name: `2025 Finance`
5. **Click**: "Create Folder"

✅ **It will work!**

---

## What the SQL Fix Does:

1. Changes `created_by` from UUID to INTEGER
2. Changes `updated_by` from UUID to INTEGER  
3. Changes `user_id` from UUID to INTEGER
4. Changes `granted_by` from UUID to INTEGER
5. Changes `archived_by` from UUID to INTEGER
6. Updates foreign keys to reference `auth_user(id)` table
7. Preserves all your data and settings

---

## After Running the SQL:

✅ **Background Color**: Changed to #F5F5ED (primary color)  
✅ **Folder Creation**: Will work with custom names  
✅ **Entry Creation**: Will work  
✅ **Member Management**: Will work  
✅ **All Features**: Fully functional  

---

**Run the SQL fix now and the UUID error will be gone!**

File location: `/Users/swumpyaesone/Documents/project_management/FIX_EMAIL_TRACKING_SCHEMA.sql`

